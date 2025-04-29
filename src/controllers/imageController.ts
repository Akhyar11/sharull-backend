import { imageModel, IImage } from "../models/images";
import { Request, Response } from "express";

export const getImageById = async (id: string) => {
  const image: IImage[] = await imageModel.search("id", "==", id);
  if (image[0]) {
    return image[0].image_base64;
  }
};

export const getImageByFK = async (id: string) => {
  const image: IImage[] = await imageModel.search("FK", "==", id);
  return image;
};

export const createImage = async (image_base64: string, FK?: string) => {
  await imageModel.create({ FK: FK || "", image_base64 });
};

class ImageController {
  async listById(req: Request, res: Response) {
    try {
      const { id } = req.query;

      const images = getImageById(id as string);

      res.status(200).json({ images });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch image" });
    }
  }
  async listByFK(req: Request, res: Response) {
    try {
      const { id } = req.query;

      const image = getImageByFK(id as string);

      res.status(200).json({ image });
    } catch (error) {
      res.status(500).json({ msg: "Failed to fetch image" });
    }
  }
}

export const imageController = new ImageController();
