/**
 * Tab Manager Module
 * Handles tab navigation and content switching.
 *
 * Each tab is a button `#<name>-tab` paired with a panel `#<name>-content`
 * in index.html. TAB_NAMES is the single list of names: click binding,
 * Ctrl/Cmd+<n> shortcuts and setActiveTab() all read it, so a new tab needs
 * its two elements plus one entry here. notes/ui-ids.md lists the full ids.
 */

export const TAB_NAMES = ['calculator', 'federal-math', 'provincial-math', 'payroll-math'];

export class TabManager {
    constructor() {
        this.activeTab = TAB_NAMES[0];
        this.init();
    }

    init() {
        this.bindTabEvents();
        this.setActiveTab(TAB_NAMES[0], { focus: false });
    }

    /**
     * Bind click events to every tab button, and Ctrl/Cmd+1..n shortcuts.
     */
    bindTabEvents() {
        TAB_NAMES.forEach(name => {
            const button = document.getElementById(`${name}-tab`);
            if (button) {
                button.addEventListener('click', () => this.setActiveTab(name));
            } else {
                console.warn(`TabManager: missing #${name}-tab`);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!(e.ctrlKey || e.metaKey)) return;
            const index = Number.parseInt(e.key, 10) - 1;
            if (Number.isInteger(index) && index >= 0 && index < TAB_NAMES.length) {
                e.preventDefault();
                this.setActiveTab(TAB_NAMES[index]);
            }
        });
    }

    /**
     * Set the active tab.
     * @param {string} tabName - one of TAB_NAMES
     * @param {{focus?: boolean}} [opts]
     */
    setActiveTab(tabName, { focus = true } = {}) {
        if (!TAB_NAMES.includes(tabName)) return;

        const activeTabButton = document.getElementById(`${tabName}-tab`);
        const activeTabContent = document.getElementById(`${tabName}-content`);
        if (!activeTabButton || !activeTabContent) {
            console.warn(`TabManager: missing #${tabName}-tab or #${tabName}-content`);
            return;
        }

        TAB_NAMES.forEach(name => {
            const button = document.getElementById(`${name}-tab`);
            const content = document.getElementById(`${name}-content`);
            if (button) {
                button.classList.remove('active');
                button.setAttribute('aria-selected', 'false');
            }
            if (content) content.classList.remove('active');
        });

        activeTabButton.classList.add('active');
        activeTabButton.setAttribute('aria-selected', 'true');
        activeTabContent.classList.add('active');
        this.activeTab = tabName;

        if (focus) activeTabButton.focus();

        document.dispatchEvent(new CustomEvent('tabChanged', {
            detail: { activeTab: tabName }
        }));
    }

    getActiveTab() {
        return this.activeTab;
    }

    nextTab() {
        const i = TAB_NAMES.indexOf(this.activeTab);
        this.setActiveTab(TAB_NAMES[(i + 1) % TAB_NAMES.length]);
    }

    previousTab() {
        const i = TAB_NAMES.indexOf(this.activeTab);
        this.setActiveTab(TAB_NAMES[(i - 1 + TAB_NAMES.length) % TAB_NAMES.length]);
    }
}
