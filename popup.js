// RTL Text Fixer - Popup Interface

document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggle-btn');
    const siteToggleBtn = document.getElementById('site-toggle-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const visualToggleBtn = document.getElementById('visual-toggle-btn');
    const statusSpan = document.getElementById('extension-status');
    const siteSpan = document.getElementById('current-site');
    const siteStatusSpan = document.getElementById('site-status');

    let isEnabled = true;
    let siteEnabled = false;
    let visualFeedbackEnabled = true;

    // Update popup with current extension status
    function updateStatus() {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (!tabs || tabs.length === 0) {
                    siteSpan.textContent = 'Unknown';
                    siteSpan.style.color = '#6c757d';
                    return;
                }

                const currentTab = tabs[0];
                const url = currentTab.url || '';
                const hostname = new URL(url).hostname;

                // Show current website
                siteSpan.textContent = hostname || 'Unknown';
                siteSpan.style.color = hostname ? '#333' : '#6c757d';

                // Get extension state from content script
                try {
                    chrome.scripting.executeScript({
                        target: { tabId: currentTab.id },
                        function: () => {
                            return {
                                active: window.rtlExtensionActive || false,
                                visualFeedback: window.rtlVisualFeedbackEnabled !== undefined ? window.rtlVisualFeedbackEnabled : true,
                                enabledSites: window.rtlEnabledSites || [],
                                currentSite: window.location.hostname
                            };
                        }
                    }, (results) => {
                        try {
                            if (results && results[0] && results[0].result) {
                                const result = results[0].result;
                                
                                // Update main extension status
                                if (result.active) {
                                    statusSpan.textContent = 'Active';
                                    statusSpan.className = 'status-active';
                                    toggleBtn.textContent = 'Disable Extension';
                                    isEnabled = true;
                                } else {
                                    statusSpan.textContent = 'Disabled';
                                    statusSpan.className = 'status-inactive';
                                    toggleBtn.textContent = 'Enable Extension';
                                    isEnabled = false;
                                }

                                // Update visual feedback toggle
                                visualFeedbackEnabled = result.visualFeedback;
                                visualToggleBtn.textContent = visualFeedbackEnabled ? 'Disable Blue Effect' : 'Enable Blue Effect';

                                // Update site-specific status
                                siteEnabled = result.enabledSites && result.enabledSites.includes(result.currentSite);
                                if (siteEnabled) {
                                    siteStatusSpan.textContent = 'Enabled';
                                    siteStatusSpan.className = 'status-active';
                                    siteToggleBtn.textContent = 'Disable for this Site';
                                    siteToggleBtn.className = 'btn btn-warning';
                                } else {
                                    siteStatusSpan.textContent = 'Disabled';
                                    siteStatusSpan.className = 'status-inactive';
                                    siteToggleBtn.textContent = 'Enable for this Site';
                                    siteToggleBtn.className = 'btn btn-warning';
                                }
                            } else {
                                statusSpan.textContent = 'Disabled';
                                statusSpan.className = 'status-inactive';
                                toggleBtn.textContent = 'Enable Extension';
                                isEnabled = false;
                                visualToggleBtn.textContent = 'Enable Blue Effect';
                            }
                        } catch (e) {
                            console.warn('Error reading extension status:', e);
                            statusSpan.textContent = 'Unknown';
                            statusSpan.className = 'status-unknown';
                        }
                    });
                } catch (e) {
                    console.warn('Error executing script:', e);
                    statusSpan.textContent = 'Error';
                    statusSpan.className = 'status-inactive';
                }
            });
        } catch (e) {
            console.error('Error in updateStatus:', e);
            siteSpan.textContent = 'Error';
            statusSpan.textContent = 'Error';
        }
    }

    // Toggle main extension on/off
    function toggleExtension() {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (!tabs || tabs.length === 0) return;
                
                const currentTab = tabs[0];

                if (isEnabled) {
                    // Disable extension
                    chrome.scripting.executeScript({
                        target: { tabId: currentTab.id },
                        function: () => {
                            window.rtlExtensionActive = false;
                            // Save new state
                            if (window.saveRTLSettings) {
                                window.saveRTLSettings();
                            }
                            // Remove all RTL styling
                            const rtlElements = document.querySelectorAll('[data-rtl-applied]');
                            rtlElements.forEach(el => {
                                el.removeAttribute('data-rtl-applied');
                                el.style.direction = '';
                                el.style.textAlign = '';
                                el.style.fontFamily = '';
                            });
                        }
                    });
                    isEnabled = false;
                    statusSpan.textContent = 'Disabled';
                    statusSpan.className = 'status-inactive';
                    toggleBtn.textContent = 'Enable Extension';
                } else {
                    // Enable extension
                    chrome.scripting.executeScript({
                        target: { tabId: currentTab.id },
                        function: () => {
                            window.rtlExtensionActive = true;
                            // Save new state
                            if (window.saveRTLSettings) {
                                window.saveRTLSettings();
                            }
                            // Re-scan for RTL content
                            if (window.processElements) {
                                window.processElements();
                            }
                        }
                    });
                    isEnabled = true;
                    statusSpan.textContent = 'Active';
                    statusSpan.className = 'status-active';
                    toggleBtn.textContent = 'Disable Extension';
                }
            });
        } catch (e) {
            console.error('Error in toggleExtension:', e);
        }
    }

    // Refresh RTL processing
    function refreshStyling() {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (!tabs || tabs.length === 0) return;
                
                const currentTab = tabs[0];

                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    function: () => {
                        if (window.processElements) {
                            window.processElements();
                        }
                    }
                });

                // Show user feedback
                const originalText = refreshBtn.textContent;
                refreshBtn.textContent = 'Refreshed!';
                refreshBtn.style.background = '#28a745';
                setTimeout(() => {
                    refreshBtn.textContent = originalText;
                    refreshBtn.style.background = '';
                }, 2000);
            });
        } catch (e) {
            console.error('Error in refreshStyling:', e);
        }
    }

    // Toggle visual feedback (blue border)
    function toggleVisualFeedback() {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (!tabs || tabs.length === 0) return;
                
                const currentTab = tabs[0];

                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    function: (newState) => {
                        window.rtlVisualFeedbackEnabled = newState;
                        // Save settings
                        if (window.saveRTLSettings) {
                            window.saveRTLSettings();
                        }
                        console.log('Visual feedback', newState ? 'enabled' : 'disabled');
                    },
                    args: [!visualFeedbackEnabled]
                });

                // Update UI state
                visualFeedbackEnabled = !visualFeedbackEnabled;
                visualToggleBtn.textContent = visualFeedbackEnabled ? 'Disable Blue Effect' : 'Enable Blue Effect';

                // Show user feedback
                const originalText = visualToggleBtn.textContent;
                const originalColor = visualToggleBtn.style.background;
                visualToggleBtn.textContent = visualFeedbackEnabled ? 'Effect Enabled!' : 'Effect Disabled!';
                visualToggleBtn.style.background = visualFeedbackEnabled ? '#28a745' : '#dc3545';
                setTimeout(() => {
                    visualToggleBtn.textContent = originalText;
                    visualToggleBtn.style.background = originalColor;
                }, 1500);
            });
        } catch (e) {
            console.error('Error in toggleVisualFeedback:', e);
        }
    }

    // Toggle site enable/disable
    function toggleSite() {
        try {
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                if (!tabs || tabs.length === 0) return;
                
                const currentTab = tabs[0];

                if (siteEnabled) {
                    // Disable current site
                    chrome.scripting.executeScript({
                        target: { tabId: currentTab.id },
                        function: () => {
                            if (window.disableCurrentSite) {
                                return window.disableCurrentSite();
                            }
                            return false;
                        }
                    }, (results) => {
                        if (results && results[0] && results[0].result) {
                            siteEnabled = false;
                            siteStatusSpan.textContent = 'Disabled';
                            siteStatusSpan.className = 'status-inactive';
                            siteToggleBtn.textContent = 'Enable for this Site';
                            
                            // User feedback
                            siteToggleBtn.textContent = 'Site Disabled!';
                            siteToggleBtn.style.background = '#dc3545';
                            setTimeout(() => {
                                siteToggleBtn.textContent = 'Enable for this Site';
                                siteToggleBtn.style.background = '';
                            }, 1500);
                        }
                    });
                } else {
                    // Enable current site
                    chrome.scripting.executeScript({
                        target: { tabId: currentTab.id },
                        function: () => {
                            if (window.enableCurrentSite) {
                                return window.enableCurrentSite();
                            }
                            return false;
                        }
                    }, (results) => {
                        if (results && results[0] && results[0].result) {
                            siteEnabled = true;
                            siteStatusSpan.textContent = 'Enabled';
                            siteStatusSpan.className = 'status-active';
                            siteToggleBtn.textContent = 'Disable for this Site';
                            
                            // User feedback
                            siteToggleBtn.textContent = 'Site Enabled!';
                            siteToggleBtn.style.background = '#28a745';
                            setTimeout(() => {
                                siteToggleBtn.textContent = 'Disable for this Site';
                                siteToggleBtn.style.background = '';
                            }, 1500);
                        }
                    });
                }
            });
        } catch (e) {
            console.error('Error in toggleSite:', e);
        }
    }

    // Wire up event handlers
    try {
        toggleBtn.addEventListener('click', toggleExtension);
        siteToggleBtn.addEventListener('click', toggleSite);
        refreshBtn.addEventListener('click', refreshStyling);
        visualToggleBtn.addEventListener('click', toggleVisualFeedback);
    } catch (e) {
        console.error('Error adding event listeners:', e);
    }

    // Initialize popup
    updateStatus();

    // Update when tab changes
    try {
        chrome.tabs.onActivated.addListener(updateStatus);
    } catch (e) {
        console.warn('Error setting up tab listener:', e);
    }
});
