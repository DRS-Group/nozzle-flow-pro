import { useEffect, useState } from "react";
import { Page } from "../types/page.type";
import { services } from "../dependency-injection";

export function useNavigation() {
    const navigationService = services.navigationService;

    const [currentPage, setCurrentPage] = useState<Page>('menu');
    const [previousPage, setPreviousPage] = useState<Page | undefined>('menu');

    useEffect(() => {
        setCurrentPage(navigationService.getCurrentPage());
        setPreviousPage(navigationService.getPreviousPage());

        const eventHandler = async (page: Page) => {
            setCurrentPage(page);
            setPreviousPage(navigationService.getPreviousPage());
        };
        navigationService.addEventListener('onNavigate', eventHandler);
        return () => {
            navigationService.removeEventListener('onNavigate', eventHandler);
        }

    }, [setCurrentPage, setPreviousPage, currentPage, previousPage]);

    const navigate = (page: Page) => {
        navigationService.navigate(page);
    }

    const navigateBack = () => {
        navigationService.navigateBack();
    }

    const clearHistory = () => {
        navigationService.clearHistory();
    }

    return {
        currentPage,
        previousPage,
        navigate,
        navigateBack,
        clearHistory
    }
}