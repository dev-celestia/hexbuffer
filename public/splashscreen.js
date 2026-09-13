(function () {
  var slides = Array.from(document.querySelectorAll('.slide'));
  var dots = Array.from(document.querySelectorAll('.dot'));
  var currentIndex = 0;
  var totalSlides = slides.length;
  var intervalId = null;
  var SLIDE_DURATION = 1400;

  function goToSlide(nextIndex) {
    if (nextIndex === currentIndex) return;

    var currentSlide = slides[currentIndex];
    var nextSlide = slides[nextIndex];

    currentSlide.classList.remove('active');
    currentSlide.classList.add('exit');

    nextSlide.classList.remove('exit');
    nextSlide.classList.add('active');

    dots[currentIndex].classList.remove('active');
    dots[nextIndex].classList.add('active');

    setTimeout(function () {
      currentSlide.classList.remove('exit');
    }, 450);

    currentIndex = nextIndex;
  }

  function nextSlide() {
    var next = (currentIndex + 1) % totalSlides;
    goToSlide(next);
  }

  function startSlideshow() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(nextSlide, SLIDE_DURATION);
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var index = parseInt(dot.getAttribute('data-index'), 10);
      if (!isNaN(index)) {
        goToSlide(index);
        startSlideshow();
      }
    });
  });

  startSlideshow();
})();
