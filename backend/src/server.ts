import "dotenv/config";
import app from "./app";

import { Request, Response } from "express";

const PORT = parseInt(process.env.PORT || "5000", 10);

app.get("/", (req: Request, res: Response) => {
  res.send("API running 🚀");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});