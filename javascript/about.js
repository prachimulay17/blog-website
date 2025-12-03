let home = document.querySelector('#home');
let about = document.querySelector('#about');
let contact = document.querySelector('#contact');
let profile = document.querySelector('.profile-icon');

function location(){
    if(window.location.href='/html/about.html'){
        about.style.display='none';
         contact.style.display='none';
         profile.style.display='none';
    }
}

