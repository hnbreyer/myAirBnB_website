

window.addEventListener('scroll', function(){
    let windowPosition = window.scrollY > 100;
    header.classList.toggle('active', windowPosition);
})


let header = document.querySelector('.header');
let hamburgerMenu = document.querySelector('.hamburger-menu');

hamburgerMenu.addEventListener('click', function(){
    header.classList.toggle('menu-open');
})