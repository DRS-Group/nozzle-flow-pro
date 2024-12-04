import { BaseService, IBaseService } from "../types/base-service.type";
import { Page } from "../types/page.type";


type navigationServiceEvents = 'onNavigate';

export interface INavigationService extends IBaseService<navigationServiceEvents> {
    navigate: (page: Page) => void;
    getCurrentPage: () => Page;
    navigateBack: () => void;
    getPreviousPage: () => Page | undefined;
    clearHistory: () => void;
}

export interface INavigationService extends IBaseService<navigationServiceEvents> {
    navigate: (page: Page) => void;
    getCurrentPage: () => Page;
    navigateBack: () => void;
    getPreviousPage: () => Page | undefined;
    clearHistory: () => void;
}

export class NavigationService extends BaseService<navigationServiceEvents> implements INavigationService {
    private currentPage: Page = 'menu';
    private navigationHistory: Page[] = ['menu'];

    public navigate = (page: Page) => {
        if (page === this.currentPage) return;
        this.currentPage = page;
        this.navigationHistory.push(page);
        this.dispatchEvent('onNavigate', page);
    }

    public getCurrentPage = () => {
        return this.currentPage;
    }

    public navigateBack = () => {
        const previousPage = this.getPreviousPage();
        if (previousPage === undefined) return;

        this.currentPage = previousPage;
        this.navigationHistory.pop();
        this.dispatchEvent('onNavigate', previousPage);
    }

    public getPreviousPage = (): Page | undefined => {
        return this.navigationHistory[this.navigationHistory.length - 2];
    }

    public clearHistory = () => {
        this.navigationHistory = [this.getCurrentPage()];
    }
}