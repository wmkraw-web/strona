export default async function handler(req, res) {
  // Akceptujemy tylko zapytania typu POST (bezpieczne przesyłanie danych)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metoda niedozwolona' });
  }

  const { prompt, system, temperature = 0.5, format = "text" } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'Brak polecenia (promptu)' });
  }

  try {
    // Budujemy paczkę z danymi dla oficjalnego API OpenAI
    const payload = {
      model: "gpt-4o-mini", // Superszybki i tani model
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: temperature
    };

    // Jeśli strona prosi o formt JSON, wymuszamy to na serwerze
    if (format === "json") {
      payload.response_format = { type: "json_object" };
    }

    // Bezpośrednie, ukryte połączenie z OpenAI
    // Używa tajnego klucza zdefiniowanego w Vercelu (process.env.OPENAI_API_KEY)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Błąd AI: ${response.statusText}`);
    }

    // Odsyłamy czysty tekst z powrotem do Twojej strony w przeglądarce
    res.status(200).json({ text: data.choices[0].message.content });

  } catch (error) {
    console.error("Błąd podczas generowania w API:", error);
    res.status(500).json({ message: 'Wystąpił błąd serwera AI.', details: error.message });
  }
}
