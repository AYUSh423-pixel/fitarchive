const API_KEY = 'vdk_eyAml9DSFSVzTIUOH5Pi47p_W7AShio5t1S5ZpbpKqA';
const prompt = `Analyze this meal: 2 rotis and 1 bowl dal.
Respond ONLY in valid raw JSON with this exact shape without any markdown explanation or greetings:
{
  "dishTitle": "Roti Dal Thali",
  "cuisineLabel": "Homemade Indian",
  "items": [
    {
      "name": "Roti",
      "quantity": 2,
      "unit": "piece",
      "weightGrams": 70,
      "calories": 170,
      "proteinG": 6,
      "carbsG": 35,
      "fatG": 1,
      "oilGheeGrams": 0,
      "confidence": "high",
      "sharePct": 50
    }
  ],
  "clarifyingQuestions": []
}`;

async function test() {
  const res = await fetch('https://www.vidhyantra.online/api/v1/chat/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + API_KEY },
    body: JSON.stringify({ model: 'sol', message: prompt })
  });
  const data = await res.json();
  console.log('Vidhyantra Response:');
  console.log(data.reply);
}
test().catch(console.error);
