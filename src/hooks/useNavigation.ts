import { useEffect, useState } from "react";
import { Page } from "../types/page.type";
import { NavigationService } from "../services/navigation.service";

export function useNavigation() {
    const [currentPage, setCurrentPage] = useState<Page>('menu');
    const [previousPage, setPreviousPage] = useState<Page | undefined>('menu');

    useEffect(() => {
        setCurrentPage(NavigationService.getCurrentPage());
        setPreviousPage(NavigationService.getPreviousPage());

        const eventHandler = async (page: Page) => {
            setCurrentPage(page);
            setPreviousPage(NavigationService.getPreviousPage());
        };
        NavigationService.addEventListener('onNavigate', eventHandler);
        return () => {
            NavigationService.removeEventListener('onNavigate', eventHandler);
        }

    }, [setCurrentPage, setPreviousPage, currentPage, previousPage]);

    const navigate = (page: Page) => {
        NavigationService.navigate(page);
    }

    const navigateBack = () => {
        NavigationService.navigateBack();
    }

    const clearHistory = () => {
        NavigationService.clearHistory();
    }

    return {
        currentPage,
        previousPage,
        navigate,
        navigateBack,
        clearHistory
    }
}