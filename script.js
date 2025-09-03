// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const button = document.getElementById('clickMe');
    const message = document.getElementById('message');
    
    // Add click event listener to the button
    button.addEventListener('click', () => {
        // Change the message text
        message.textContent = 'Button clicked! 🎉';
        
        // Add a class for animation
        message.classList.add('show');
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            message.textContent = '';
            message.classList.remove('show');
        }, 3000);
    });
});
