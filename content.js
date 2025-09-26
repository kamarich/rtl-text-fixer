// RTL Text Fixer - Content Script
// Automatically detects and applies proper text direction for Arabic and Persian content

(function() {
    'use strict';

    // Character ranges for RTL languages (Arabic, Persian, Hebrew, etc.)
    const RTL_CHARS_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

    // RTL styling rules
    const RTL_STYLES = 'direction: rtl !important; text-align: right !important; font-family: Tahoma, Arial, sans-serif !important;';

    // Visual feedback for debugging (blue border)
    const DEBUG_BORDER_STYLES = 'border: 2px solid #007bff !important; border-radius: 4px !important; transition: border 0.3s ease !important;';

    // Extension state variables
    window.rtlExtensionActive = true;
    window.rtlVisualFeedbackEnabled = true;

    // Configuration keys for chrome storage
    const STORAGE_KEYS = {
        EXTENSION_ACTIVE: 'rtlExtensionActive',
        VISUAL_FEEDBACK: 'rtlVisualFeedbackEnabled',
        ENABLED_SITES: 'rtlEnabledSites',
        SITE_SETTINGS: 'rtlSiteSettings'
    };

    // No sites enabled by default - user must manually enable each site
    const DEFAULT_ENABLED_SITES = [];

    // Get the hostname of current site
    function getCurrentSite() {
        try {
            return window.location.hostname;
        } catch (e) {
            return '';
        }
    }

    // Check if RTL processing is enabled for current site
    function isSiteEnabled() {
        const currentSite = getCurrentSite();
        if (!currentSite) return false;
        
        return window.rtlEnabledSites && window.rtlEnabledSites.includes(currentSite);
    }

    // Load user preferences from browser storage
    function loadSettings() {
        try {
            chrome.storage.sync.get([
                STORAGE_KEYS.EXTENSION_ACTIVE,
                STORAGE_KEYS.VISUAL_FEEDBACK,
                STORAGE_KEYS.ENABLED_SITES
            ], function(result) {
                // Extension enabled state (default: true)
                window.rtlExtensionActive = result[STORAGE_KEYS.EXTENSION_ACTIVE] !== undefined 
                    ? result[STORAGE_KEYS.EXTENSION_ACTIVE] 
                    : true;

                // Visual feedback state (default: true)
                window.rtlVisualFeedbackEnabled = result[STORAGE_KEYS.VISUAL_FEEDBACK] !== undefined 
                    ? result[STORAGE_KEYS.VISUAL_FEEDBACK] 
                    : true;

                // List of enabled sites (default: empty array)
                window.rtlEnabledSites = result[STORAGE_KEYS.ENABLED_SITES] || DEFAULT_ENABLED_SITES;

                console.log('Settings loaded successfully', {
                    extensionActive: window.rtlExtensionActive,
                    visualFeedback: window.rtlVisualFeedbackEnabled,
                    enabledSites: window.rtlEnabledSites,
                    currentSite: getCurrentSite(),
                    siteEnabled: isSiteEnabled()
                });

                // Start processing if extension and site are both enabled
                if (window.rtlExtensionActive && isSiteEnabled()) {
                    setTimeout(processElements, 100);
                }
            });
        } catch (e) {
            console.warn('Error loading extension settings', e);
            // Use defaults if storage fails
            window.rtlExtensionActive = true;
            window.rtlVisualFeedbackEnabled = true;
            window.rtlEnabledSites = DEFAULT_ENABLED_SITES;
        }
    }

    // Save current settings to browser storage
    function saveSettings() {
        try {
            const settings = {
                [STORAGE_KEYS.EXTENSION_ACTIVE]: window.rtlExtensionActive,
                [STORAGE_KEYS.VISUAL_FEEDBACK]: window.rtlVisualFeedbackEnabled,
                [STORAGE_KEYS.ENABLED_SITES]: window.rtlEnabledSites
            };

            chrome.storage.sync.set(settings, function() {
                console.log('Extension settings saved', settings);
            });
        } catch (e) {
            console.warn('Error saving extension settings', e);
        }
    }

    // Enable RTL processing for current site
    window.enableCurrentSite = function() {
        const currentSite = getCurrentSite();
        if (currentSite && !window.rtlEnabledSites.includes(currentSite)) {
            window.rtlEnabledSites.push(currentSite);
            saveSettings();
            // Start processing on newly enabled site
            if (window.rtlExtensionActive) {
                setTimeout(processElements, 100);
            }
            return true;
        }
        return false;
    };

    // Disable RTL processing for current site
    window.disableCurrentSite = function() {
        const currentSite = getCurrentSite();
        const index = window.rtlEnabledSites.indexOf(currentSite);
        if (index > -1) {
            window.rtlEnabledSites.splice(index, 1);
            saveSettings();
            // Remove all RTL styling from current site
            const rtlElements = document.querySelectorAll('[data-rtl-applied]');
            rtlElements.forEach(el => {
                el.removeAttribute('data-rtl-applied');
                el.style.direction = '';
                el.style.textAlign = '';
                el.style.fontFamily = '';
            });
            return true;
        }
        return false;
    };

    // Make save function available globally
    window.saveRTLSettings = saveSettings;

    // Check if text contains RTL characters
    function hasRTLText(text) {
        return RTL_CHARS_REGEX.test(text);
    }

    // Add temporary visual feedback (blue border for 1 second)
    function addVisualFeedback(element) {
        try {
            // Only show visual feedback if enabled
            if (!window.rtlVisualFeedbackEnabled) {
                return;
            }

            const originalBorder = element.style.border;
            element.style.cssText += DEBUG_BORDER_STYLES;
            
            setTimeout(() => {
                try {
                    element.style.border = originalBorder;
                    console.log('Removed visual feedback from', element.tagName);
                } catch (e) {
                    console.warn('Error removing visual feedback', e);
                }
            }, 1000);
        } catch (e) {
            console.warn('Error adding visual feedback', e);
        }
    }

    // Check if element contains RTL text content
    function containsRTLText(element) {
        try {
            const text = element.textContent || '';
            
            // Must have RTL characters and reasonable length
            if (!hasRTLText(text) || text.trim().length < 5) {
                return false;
            }

            return true;
        } catch (e) {
            console.warn('Error checking RTL text', e);
            return false;
        }
    }

    // Find the best parent element to apply RTL styling to
    function findRTLParent(element) {
        try {
            let current = element;
            let bestParent = element;
            let levels = 0;
            const maxLevels = 3;

            while (current && current.parentElement && levels < maxLevels) {
                const parent = current.parentElement;
                const parentTag = parent.tagName.toLowerCase();
                const parentClass = (parent.className || '').toString().toLowerCase();

                // Stop at navigation or structural elements
                const structuralElements = ['nav', 'header', 'footer', 'body', 'html'];
                const structuralClasses = ['navbar', 'header', 'footer', 'menu', 'toolbar'];
                
                if (structuralElements.includes(parentTag) || 
                    structuralClasses.some(cls => parentClass.includes(cls))) {
                    break;
                }

                // Prefer content containers
                const contentContainers = ['div', 'section', 'article', 'main', 'p'];
                if (contentContainers.includes(parentTag)) {
                    bestParent = parent;
                }

                current = parent;
                levels++;
            }

            return bestParent;
        } catch (e) {
            console.warn('Error finding parent element', e);
            return element;
        }
    }

    // Check if element should be avoided (UI controls, etc.)
    function shouldAvoidElement(element) {
        try {
            const tagName = element.tagName.toLowerCase();
            const className = (element.className || '').toString().toLowerCase();
            const id = (element.id || '').toLowerCase();

            // Skip UI elements
            const uiKeywords = ['button', 'btn', 'menu', 'nav', 'toolbar', 'icon', 'control'];
            if (uiKeywords.some(keyword => className.includes(keyword) || id.includes(keyword))) {
                return true;
            }

            // Skip very wide elements that might be layout containers
            if (element.offsetWidth > window.innerWidth * 0.8) {
                return true;
            }

            return false;
        } catch (e) {
            return true;
        }
    }

    // Apply RTL styling to parent element
    function applyRTLToParent(childElement) {
        try {
            // Only process if extension is active and site is enabled
            if (!window.rtlExtensionActive || !isSiteEnabled()) {
                return false;
            }

            // Find best parent element
            const targetParent = findRTLParent(childElement);
            
            // Skip if already processed
            if (targetParent.hasAttribute('data-rtl-applied')) {
                return false;
            }

            // Skip UI elements
            if (shouldAvoidElement(targetParent)) {
                return false;
            }

            // Apply RTL styling
            targetParent.setAttribute('data-rtl-applied', 'true');
            targetParent.style.cssText += RTL_STYLES;
            
            // Add visual debugging feedback
            addVisualFeedback(targetParent);
            
            console.log('Applied RTL styling to element', {
                site: getCurrentSite(),
                parentTag: targetParent.tagName,
                parentClass: targetParent.className,
                childTag: childElement.tagName,
                textPreview: childElement.textContent.substring(0, 30) + '...',
                dimensions: `${targetParent.offsetWidth}x${targetParent.offsetHeight}`
            });
            
            return true;
        } catch (e) {
            console.warn('Error applying RTL styling', e);
            return false;
        }
    }

    // Scan document for elements containing RTL text
    function scanForRTLElements() {
        try {
            // Only scan if extension is active and site is enabled
            if (!window.rtlExtensionActive || !isSiteEnabled()) {
                console.log('Extension scanning disabled', {
                    extensionActive: window.rtlExtensionActive,
                    siteEnabled: isSiteEnabled(),
                    currentSite: getCurrentSite()
                });
                return 0;
            }

            // Look for text elements
            const textElements = document.querySelectorAll('span, p, div, h1, h2, h3, h4, h5, h6');
            let processedCount = 0;

            textElements.forEach(element => {
                try {
                    if (containsRTLText(element)) {
                        if (applyRTLToParent(element)) {
                            processedCount++;
                        }
                    }
                } catch (error) {
                    console.warn('Error processing element', error);
                }
            });

            return processedCount;
        } catch (e) {
            console.error('Error scanning page elements', e);
            return 0;
        }
    }

    // Main processing function
    function processElements() {
        console.log(`Scanning ${getCurrentSite()} for RTL content`);

        try {
            const processedCount = scanForRTLElements();
            console.log(`Processed ${processedCount} RTL elements on ${getCurrentSite()}`);
            
            // Debug info if nothing found
            if (processedCount === 0 && window.rtlExtensionActive && isSiteEnabled()) {
                console.log(`No RTL content found on ${getCurrentSite()}`);
            }
        } catch (e) {
            console.error('Error during RTL processing', e);
        }
    }

    // Make processing function available globally for popup
    window.processElements = processElements;

    // Set up mutation observer for dynamic content
    function setupMutationObserver() {
        try {
            const observer = new MutationObserver((mutations) => {
                // Only process if extension is active and site is enabled
                if (!window.rtlExtensionActive || !isSiteEnabled()) {
                    return;
                }

                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            try {
                                // Check new element
                                if (containsRTLText(node)) {
                                    applyRTLToParent(node);
                                }
                                
                                // Check child elements
                                const textChildren = node.querySelectorAll('span, p, div, h1, h2, h3, h4, h5, h6');
                                textChildren.forEach(child => {
                                    if (containsRTLText(child)) {
                                        applyRTLToParent(child);
                                    }
                                });
                            } catch (error) {
                                console.warn('Error processing new element', error);
                            }
                        }
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        } catch (e) {
            console.error('Error setting up DOM observer', e);
        }
    }

    // Initialize extension
    function init() {
        console.log('Initializing RTL text processor');

        try {
            // Load settings first
            loadSettings();
            
            // Set up mutation observer
            setTimeout(setupMutationObserver, 1000);
            
            // Periodic processing for dynamic content
            setInterval(() => {
                if (window.rtlExtensionActive && isSiteEnabled()) {
                    processElements();
                }
            }, 15000);
        } catch (e) {
            console.error('Extension initialization error', e);
        }
    }

    // Start the extension
    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    } catch (e) {
        console.error('Extension startup error', e);
    }

    console.log('RTL text processor loaded successfully');
})();
