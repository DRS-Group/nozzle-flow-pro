import { BaseService } from "../types/base-service.type";
import { Page } from "../types/page.type";

export abstract class NavigationService extends BaseService {
    private static currentPage: Page = 'menu';
    private static navigationHistory: Page[] = [];

    public static navigate = (page: Page) => {
        this.currentPage = page;
        this.navigationHistory.push(page);
        this.dispatchEvent('onNavigate', page);
    }

    public static getCurrentPage = () => {
        return this.currentPage;
    }

    public static navigateBack = () => {
        const previousPage = this.getPreviousPage();
        if (previousPage === undefined) return;

        this.currentPage = previousPage;
        this.navigationHistory.pop();
        this.dispatchEvent('onNavigate', previousPage);
    }

    public static getPreviousPage = (): Page | undefined => {
        return this.navigationHistory[this.navigationHistory.length - 2];
    }

    public static clearHistory = () => {
        this.navigationHistory = [this.getCurrentPage()];
    }
}