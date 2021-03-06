var d = new Date();
var minutes = d.getMinutes(),
    hours = d.getHours(),
    month = Number(d.getMonth()+1),
    day = d.getDate();

if (Number(d.getMinutes()) < 10)  minutes = '0' + minutes;
if (Number(d.getHours()) < 10)    hours =   '0' + hours;
if (Number(d.getDate()) < 10)     day =     '0' + day;
if (Number(d.getMonth()+1) < 10)  month =   '0' + month;

currentHours = hours + ':' + minutes;
currentDate  = '2013-05-01';
//currentDate  = d.getFullYear() + '-' + month + '-' + day;


$(document).ready(function() {
  var theaters = 'C0159,C0053';
  //loadData('theaters='+ theaters, 'theaters');

  $.getJSON("allocine.json", function(data){
    loadTemplate('theaters', data);
  });

  swipe('#hours', 16);
});


function addFilm(theater, movie, start, end) {
  var insert = '<li><div class="schedules">' + start + ' - ' + end + '</div><div class=""><b>' + movie + '</b><br/> <span class="infos">' + theater + '</span></div></li>';
  $("#myMovies").append(insert);
  isSoon(end);
}

function isSoon(end) {
  var times       = document.getElementsByClassName('time'),
      timesLength = times.length,
      start,
      waiting;

  for(var i = 0; i < timesLength - 1 ; ++i) {
    start = times[i].getAttribute('data-start');
    waiting = timeToSec(start) - timeToSec(end);

    if(waiting <= 0) {

      if(!times[i].className.match(/\bover\b/))
        times[i].style.background = 'white';

      // all movies before the end are over
      if(!times[i].className.match(/\bover\b/) && !times[i].className.match(/\bselected\b/)) {
        times[i].className += ' over';
        times[i].style.backgroundColor = '#ddd';
        times[i].style.color = '#bbb';
        times[i].style.textDecoration = 'line-through';
        $(times[i]).find('.timeLeft').text('');
      }

    } else {
      if(!times[i].className.match(/\bover\b/)) {
        if      (waiting  <= 7 * 60)  times[i].style.backgroundColor = '#FF7260';
        else if(waiting  <= 35 * 60)  times[i].style.backgroundColor = '#FFAF60';
        else if(waiting  <= 60 * 60)  times[i].style.backgroundColor = '#48BF67';

        if(waiting  <= 80 * 60)
          $(times[i]).find('.timeLeft').text('(' + secToMin(waiting) + 'mn)');
      }

    }

  }
}

function timeToSec(time) {
  var t = time.split(':');
  return t[0]*3600 + t[1]*60;
}

function secToTime(secs) {
  var hours   = Math.floor(secs / (60 * 60)),
      minutes = Math.floor(secs % (60 * 60) / 60);
  if (minutes < 10) minutes = '0' + minutes;
  return hours + 'h' + minutes;
}

function secToMin(secs) {
  return secs / 60;
}


function sessionStart(start, pause) {
  var startA  = start.split(':'),
      hours   = Number(startA[0]),
      minutes = Number(startA[1]) + Number(pause);
  
  if (minutes >= 60) {
    hours++;
    minutes -= 60;
  }
  
  if (minutes < 10)
    minutes = '0' + minutes;

  return hours + ':' + minutes;
}

function sessionEnd(start, duration) {
  var startA    = start.split(':'),
      durationA = duration.split('h'),
      hours     = Number(startA[0]) + Number(durationA[0]),
      minutes   = Number(startA[1]) + Number(durationA[1]);


  if (minutes > 60) {
    hours++;
    minutes -= 60;
  }

  if (minutes < 10)
    minutes = '0' + minutes;

  if (hours >= 24)
    hours = 24 - hours;

  return hours + ':' + minutes;
}

function loadData(path, template) {
  $.ajax({
    url: 'http://api.allocine.fr/rest/v3/showtimelist?partner=YW5kcm9pZC12M3M&format=json&' + path,
    contentType: 'application/json',
    dataType: 'jsonp',
    cache: true,
    processData: false,
    type: 'GET',
    success: function(data, textStatus, jqXHR) {
        loadTemplate(template, data);
    }
  });
}

function loadTemplate(templateName, templateInput) {
  var source;
  var template;
  var path = 'tpl/' + templateName + '.html';
  $.ajax({
    url: path,
    cache: false,
    success: function (data) {
      source = data;
      template = Handlebars.compile(source);
      $('#' + templateName).html(template({
        tpl: templateInput.feed.theaterShowtimes
      }));
    }
  });
};

function drawShow(start, duration, title) {
  var ctrnWidth    = 800,
      itemWidth    = ctrnWidth / 15.5,
      marginLeft   = 9 * 60,
      realStart    = (timeToMin(start) - marginLeft) / 60 * itemWidth, // timeline starts at 9am
      realDuration = Number(duration) / 60 * itemWidth;

  $('#hours').append('<div class="show" style="width:' + realDuration + 'px; left: ' + realStart + 'px;"><span class="breath">' + title + '</span></div>');
}

function timeToMin(time) {
  var t = time.split(':');
  return Number(t[0]) * 60 + Number(t[1]);
}

Handlebars.registerHelper('notPreview', function(status, options) {
  if(status == 'false')
    return options.fn(this);
  return options.inverse(this);
});

Handlebars.registerHelper('isGood', function(rate) {
  if      (rate >= 3.9) return '<3';
  else if (rate > 2.7)  return ':)';
  else if (rate > 2)    return ':/';
  else                  return ':(';
  
});

Handlebars.registerHelper('isToday', function(date, options) {
  if(date == currentDate)
    return options.fn(this);
  return options.inverse(this);
});

Handlebars.registerHelper('is3D', function(v1, options) {
  if(v1 == '3D')
    return options.fn(this);
  return options.inverse(this);
});

Handlebars.registerHelper('VF', function(v1, options) {
  if(v1 == 'false')
    return options.fn(this);
  return options.inverse(this);
});

Handlebars.registerHelper('toHours', function(secs) {
  return secToTime(secs);
});

Handlebars.registerHelper('start', function(start, pause) {
  return sessionStart(start, pause);
});


function swipe(obj, nbItem) {


  var ctrnWidth    = $(obj)[0].clientWidth,
      IMG_WIDTH    = parseInt(ctrnWidth / nbItem, 10) * 4,
      currentImg   = 0,
      maxImages    = 4,
      speed        = 500,
      imgs,
      swipeOptions = {
        swipeStatus : swipeStatus,
        threshold:75      
      }

  // swipe code from http://labs.rampinteractive.co.uk/touchSwipe/demos/
  $(function() {
    imgs = $(obj);
    imgs.swipe(swipeOptions);
  });

  function swipeStatus(event, phase, direction, distance) {
    if ( phase=="move" && (direction=="left" || direction=="right") ) {
      if      (direction == "left")   scrollImages((IMG_WIDTH * currentImg) + distance, 0);
      else if (direction == "right")  scrollImages((IMG_WIDTH * currentImg) - distance, 0);
    }
    
    else if ( phase == "cancel")
      scrollImages(IMG_WIDTH * currentImg, speed);
    
    else if ( phase =="end" )
      if (direction == "right")
        previousImage()
      else if (direction == "left")     
        nextImage()
  }

  function previousImage() {
    currentImg = Math.max(currentImg-1, 0);
    scrollImages( IMG_WIDTH * currentImg, speed);
  }

  function nextImage()  {
    currentImg = Math.min(currentImg+1, maxImages-1);
    scrollImages( IMG_WIDTH * currentImg, speed);
  }
    
  function scrollImages(distance, duration) {
    imgs.css("-webkit-transition-duration", (duration/1000).toFixed(1) + "s");
    var value = (distance<0 ? "" : "-") + Math.abs(distance).toString();
    imgs.css("-webkit-transform", "translate3d("+value +"px,0px,0px)");
  }
}