import { Colors, BaseColors, AllColors, Status, NotificationType, Size, FontSize } from "../types";
import { Icons } from "open-icon";

export const mockId = (i: number) => `mock-id-${i}`;
export const mockTitle = (i: number) => `Mock Title ${i}`;
export const mockName = (i: number) => `Mock Name ${i}`;
export const mockDescription = (i: number) => `This is a mock description for item ${i}.`;
export const mockImage = (i: number) => `https://via.placeholder.com/150?text=Image+${i}`;
export const mockSpeech = (i: number) => `This is a mock speech for item ${i}.`;

export const randomIcon = (): Icons => {
  const icons = Object.values(Icons);
  return icons[Math.floor(Math.random() * icons.length)] as Icons;
}

export const randomColor = (): Colors => {
  const colors = Object.values(AllColors);
  return colors[Math.floor(Math.random() * colors.length)] as Colors;
}

export const randomBaseColor = (): BaseColors => {
  const baseColors = Object.values(BaseColors);
  return baseColors[Math.floor(Math.random() * baseColors.length)] as BaseColors;
}

export const randomStatus = (): Status => {
  const statuses = Object.values(Status);
  return statuses[Math.floor(Math.random() * statuses.length)] as Status;
}

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const randomNotificationType = (): string => {
  const types = Object.values(NotificationType);
  return types[Math.floor(Math.random() * types.length)];
}

export const randomSize = (): string => {
  const sizes = Object.values(Size);
  return sizes[Math.floor(Math.random() * sizes.length)];
}

export const randomFontSize = (): string => {
  const sizes = Object.values(FontSize);
  return sizes[Math.floor(Math.random() * sizes.length)];
}

export const randomImage = (i: number): string => {
  return mockImage(i);
}
