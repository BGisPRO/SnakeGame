/**
 * CYBER VIPER 2088 — Main Application Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Game canvas element not found');
    return;
  }

  // Initialize Game Instance
  const game = new CyberSnakeGame(canvas);

  // Initialize UI Controller
  window.cyberUI.init(game);

  // Responsive DPI handling
  window.addEventListener('resize', () => {
    game.initCanvasDPI();
  });

  // Welcome log
  console.log('%c CYBER VIPER 2088 INITIALIZED ', 'background: #00f0ff; color: #04060e; font-weight: bold; font-size: 14px; border-radius: 4px; padding: 4px 8px;');
});
