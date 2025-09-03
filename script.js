// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Function to switch tabs
    function switchTab(tabId) {
        // Hide all tab panes
        tabPanes.forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Remove active class from all tab buttons
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show the selected tab pane
        const selectedPane = document.getElementById(tabId);
        if (selectedPane) {
            selectedPane.classList.add('active');
        }
        
        // Add active class to the clicked tab button
        const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
    }

    // Add click event listeners to tab buttons
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Initialize first tab as active
    if (tabBtns.length > 0) {
        const firstTabId = tabBtns[0].getAttribute('data-tab');
        switchTab(firstTabId);
    }
});
