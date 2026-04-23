import { app } from '../../src/index';

export default async (req: Request) => {
  return app.fetch(req);
};

export const config = {
  path: "/*",
  preferStatic: true
};
