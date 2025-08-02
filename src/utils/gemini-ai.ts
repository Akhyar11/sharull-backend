import { GoogleGenerativeAI } from "@google/generative-ai";

export const useGemini = async (geminiAPIKey: string, data: any) => {
  const genAI = new GoogleGenerativeAI(geminiAPIKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
  cek data dan berikan analisa untuk memberikan rekomendasi paket yang sesuai dengan histori data di bawah ini.
  gunakan struktur resposne json dengan field: {category, provensi, city}
  `;

  try {
    console.log(`Mengirim prompt: "${prompt}"`);
    const result = await model.generateContent(
      prompt + `${JSON.stringify(data)}`
    );
    const response = result.response;
    const text = response.text();

    console.log("\nJawaban dari Gemini:");
    console.log(text);
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
  }
};
