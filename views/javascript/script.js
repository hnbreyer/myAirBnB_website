// Get the modal
var modal1 = document.getElementById('id01');
var modal2 = document.getElementById('id02');

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal1) {
    modal1.style.display = "none";
  } else if (event.target == modal2){
    modal2.style.display = "none";
  }
}

window.addEventListener('scroll', function(){
    let windowPosition = window.scrollY > 100;
    header.classList.toggle('active', windowPosition);
})


let header = document.querySelector('.header');
let hamburgerMenu = document.querySelector('.hamburger-menu');

hamburgerMenu.addEventListener('click', function(){
    header.classList.toggle('menu-open');
})