import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;


jest.mock("../src/assets/yarn_left.png", () => "left.png");
jest.mock("../src/assets/yarn_right.png", () => "right.png");
