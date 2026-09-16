import { createApp } from "./app";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

createApp().listen(PORT, () => {
  console.log(`FPL Mini-League API running on http://localhost:${PORT}`);
  console.log(`Docs: http://localhost:${PORT}/docs`);
});
