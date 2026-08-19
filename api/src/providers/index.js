import { ForeUpProvider } from "./ForeUpProvider.js";
import { ClubCaddieProvider } from "./ClubCaddieProvider.js";
import { DirectCourseProvider } from "./DirectCourseProvider.js";

export const providers = {
  foreup: new ForeUpProvider(),
  clubcaddie: new ClubCaddieProvider(),
  direct: new DirectCourseProvider()
};
