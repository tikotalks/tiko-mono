import { popupService } from './TPopup.service';

export const closeAllPopups = (excludeId?: string) => {
	popupService.closeAllPopups(excludeId);
};
