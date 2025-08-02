import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const useGroq = async (data: any) => {
  try {
    console.log("Mengirim permintaan ke Groq AI...");

    const chatCompletion = await groq.chat.completions.create({
      // 'messages' adalah array percakapan.
      messages: [
        {
          role: "user",
          content: `
          cek data dan berikan analisa untuk memberikan rekomendasi paket yang sesuai dengan histori data di bawah ini.
          gunakan struktur resposne json dengan field: {category, provensi, city}
          jika tidak ada yang bisa di lihat dari data dibawah berikan nilai 0 saja pada field json
          
          ${JSON.stringify(data)}`,
        },
      ],
      // 'model' yang akan digunakan.
      // Model populer di Groq: 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'
      model: "llama3-8b-8192",
      response_format: { type: "json_object" },
    });

    // Cetak respons dari model
    const responseMessage =
      chatCompletion.choices[0]?.message?.content || "Tidak ada jawaban.";
    console.log("\nJawaban dari Groq:");
    console.log(responseMessage);
    return JSON.parse(responseMessage);
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
  }
};
