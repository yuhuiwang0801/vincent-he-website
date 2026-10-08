const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.nav');
menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  menuButton.textContent = expanded ? 'Menu' : 'Close';
  navigation.classList.toggle('open', !expanded);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    menuButton.click();
    menuButton.focus();
  }
});
navigation?.addEventListener('click', event => {
  if (event.target.closest('a') && menuButton?.getAttribute('aria-expanded') === 'true') menuButton.click();
});
