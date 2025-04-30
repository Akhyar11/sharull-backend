import { imageModel, IImage } from "../models/images";
import { Request, Response } from "express";

export const getImageById = async (id: string) => {
  const image: IImage[] = await imageModel.search("id", "==", id);
  return image[0];
};

export const getImageByFK = async (id: string) => {
  const image: IImage[] = await imageModel.search("FK", "==", id);
  return image;
};

export const createImage = async (image_base64: string, FK?: string) => {
  await imageModel.create({ FK: FK || "", image_base64 });
};

class ImageController {
  // Kirim langsung file gambar
  async listById(req: Request, res: Response) {
    try {
      const { id } = req.query;

      const imageData = await getImageById(id as string);

      if (!imageData) {
        res.status(404).json({ msg: "Image not found" });
        return;
      }

      const base64Data = imageData.image_base64;
      const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);

      if (!matches || matches.length !== 3) {
        res.status(400).json({ msg: "Invalid base64 image format" });
        return;
      }

      const mimeType = matches[1];
      const imageBuffer = Buffer.from(matches[2], "base64");

      res.setHeader("Content-Type", mimeType);
      res.send(imageBuffer);
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch image" });
    }
  }

  async listByFKSingel(req: Request, res: Response) {
    try {
      const { id } = req.query;

      const images = await getImageByFK(id as string);

      if (!images[0]) {
        res.status(404).json({ msg: "Image not found" });
        return;
      }

      const base64Data = images[0].image_base64;
      const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);

      if (!matches || matches.length !== 3) {
        res.status(400).json({ msg: "Invalid base64 image format" });
        return;
      }

      const mimeType = matches[1];
      const imageBuffer = Buffer.from(matches[2], "base64");

      res.setHeader("Content-Type", mimeType);
      res.send(imageBuffer);
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch image" });
    }
  }

  async listByFK(req: Request, res: Response) {
    try {
      const { id } = req.query;

      const images = await getImageByFK(id as string);

      res.status(200).json({ images });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch image" });
    }
  }
}

export const imageController = new ImageController();
