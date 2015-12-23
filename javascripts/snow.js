// requestAnimFrame shim
window.requestAnimFrame = (function()
{
   return  window.requestAnimationFrame       ||
           window.webkitRequestAnimationFrame ||
           window.mozRequestAnimationFrame    ||
           window.oRequestAnimationFrame      ||
           window.msRequestAnimationFrame     ||
           function(callback)
           {
               window.setTimeout(callback);
           };
})();

(function()
{
   Prerenderer = function()
   {
      this.images = [];
      this._renderers = [];
      return this;
   };

   Prerenderer.prototype =
   {
      images: null,
      _renderers: null,

      addRenderer: function addRenderer(fn, id)
      {
         this._renderers[id] = fn;
      },

      execute: function execute()
      {
         var buffer = document.createElement('canvas');
         for (var id in this._renderers)
         {
            this.images[id] = this._renderers[id].call(this, buffer);
         }
      }
    };
})();

function __xmassnow()
{
   var run = true;

   var width = window.innerWidth - 14,
       height = window.innerHeight - 1;

   var canvas = document.createElement('canvas');
   if (!canvas) return;
   canvas.width = width;
   canvas.height = height;
   canvas.title = "XMAS SNOW";
   canvas.style.position = "absolute";
   canvas.style.zIndex = 1000;
   canvas.style.top = window.pageYOffset + "px";
   canvas.style.left = window.pageXOffset + "px";
   document.body.appendChild(canvas);

   // bind scrolling event listener
   window.addEventListener('scroll', function()
      {
         canvas.style.top = window.pageYOffset + "px";
         canvas.style.left = window.pageXOffset + "px";
      }, false);

   // bind resize event listener
   window.addEventListener('resize', function()
      {
         width = window.innerWidth - 14;
         height = window.innerHeight - 1;
         canvas.width = width;
         canvas.height = height;
      }, false);

   // bind key event handler
   window.addEventListener("keydown", function(event) {
         var keyCode = (!event ? window.event.keyCode : event.keyCode);
         switch (keyCode)
         {
            case 27:    // ESC
               canvas.style.display = "none";
               run = false;
               break;
         }
      }, false);

   // get 2d graphics context and set global alpha
   var G=canvas.getContext("2d");

   // setup aliases
   var Rnd = Math.random,
       Sin = Math.sin,
       Flr = Math.floor;

   // constants and storage for objects that represent snow flake positions
   var IMGSIZE = 64,
       depth = 15,
       scalef = IMGSIZE/depth,         // rendered graphic width / depth
       units = 300,
       flakes = [],
       Z = 0.04,
       SA = Math.PI,
       count = 0,
       avcount = 0,
       countTime = Date.now(),
       FLAKETYPES = 16;

   // function to reset a flake object
   var fnResetFlake = function resetFlake(f, d)
   {
      f.px = f.x = (Rnd() * width - (width * 0.5)) * depth;
      f.py = f.y = (Rnd() * height - (height * 0.2)) * depth;
      f.z = d;
      f.s = Rnd();   // random seed for each snowflake
   };

   // initial flake setup
   for (var i=0, n; i<units; i++)
   {
      n = {};
      fnResetFlake(n, Rnd() * depth);
      flakes.push(n);
   }

   // perform prerendering steps
   var pr = new Prerenderer();
   pr.addRenderer(function(buffer) {
      var size = IMGSIZE;
      // start radius of LOD snowflake
      var rad = size/4;
      var ff = function(i)
      {
         buffer.width = buffer.height = size;
         var ctx = buffer.getContext('2d');
         ctx.fillStyle = "#fff";
         ctx.shadowBlur = 32;
         ctx.shadowColor = "#000";
         ctx.translate(size/2, size/2);

         // render basic star style snowflake spokes
         ctx.beginPath();
         for (var m=0,g=rad/((i%8)+4),h=rad/((i%4)+2); m<6; m++)
         {
            ctx.lineTo(-g, h);
            ctx.lineTo(0, rad);
            ctx.lineTo(g, h);
            ctx.lineTo(0, 0);
            ctx.rotate(Math.PI / 3);
         }
         ctx.fill();

         // render outer spikes
         ctx.globalCompositeOperation = "xor";
         for (var s=0,g=rad/((i%3)+3),r=rad/((i%2)+4),p=rad*0.5; s<6; s++)
         {
            ctx.beginPath();
            ctx.moveTo(0, p);
            ctx.lineTo(-g, p-r);
            ctx.lineTo(0, p-r-0);
            ctx.lineTo(g, p-r);
            ctx.fill();
            ctx.rotate(Math.PI / 3);
         }
         // render middle spikes
         //ctx.globalCompositeOperation = "source-over";
         for (var s=0,g=rad/((i%5)+3),r=rad/((i%2)+3),p=rad*.75; s<6; s++)
         {
            ctx.beginPath();
            ctx.moveTo(0, p);
            ctx.lineTo(-g, p-r);
            ctx.lineTo(0, p-r-1);
            ctx.lineTo(g, p-r);
            ctx.fill();
            ctx.rotate(Math.PI / 3);
         }
         // render inner spikes
         ctx.globalCompositeOperation = "xor";
         for (var s=0,g=rad/((i%4)+3),r=rad/((i%3)+3),p=rad; s<6; s++)
         {
            ctx.beginPath();
            ctx.moveTo(0, p);
            ctx.lineTo(-g, p-r);
            ctx.lineTo(0, p-r-2);
            ctx.lineTo(g, p-r);
            ctx.fill();
            ctx.rotate(Math.PI / 3);
         }
      };

      var imgs = [];
      for (var i=0; i<FLAKETYPES; i++)
      {
         ff.call(this, i);
         var img = new Image();
         img.src = buffer.toDataURL("image/png");
         imgs.push(img);
      }

      return imgs;
   }, "flakes");
   pr.execute();

   // star rendering anim function
   var rf = function()
   {
      // clear background
      //G.fillStyle = "rgba(64,64,64,.85)";
      G.clearRect(0, 0, width, height);

      // update all flakes
      G.save();
      for (var i=0; i<units; i++)
      {
         var n = flakes[i],
             w = Sin(SA) * 64 - 32,
             xx = n.x / n.z,
             nx = xx + width/2 - w,
             yy = n.y / n.z,// + w,
             ny = yy,
             // fog alpha fade in
             alpha = n.z > depth - 10 ? (depth - n.z)/10 : 1,
             // start radius of LOD snowflake
             rad = (depth - n.z) * scalef;

         // fade in (fog effect) using alpha value
         G.save();
         G.globalAlpha = alpha;
         G.translate(nx, ny);
         // handle Firefox scale(0,0) bug
         var scale = rad/(depth * scalef) > 0 ? rad/(depth * scalef) : 0.01;
         G.scale(scale, scale);
         // randomize the initial snowflake rotation
         G.rotate(n.s * (i%2 ? 1 : -1) * ((i % 3)+1)*0.125);
         // draw the snowflake img offset to the centre (already scaled by context)
         G.drawImage(pr.images["flakes"][i%FLAKETYPES], -IMGSIZE*0.5, -IMGSIZE*0.5);
         G.restore();

         // update flake position and sinewave offset state
         n.px = xx;
         n.py = yy;
         n.z -= Z;
         n.s += Rnd()/8;

         // reset when flake is out of the view field
         if (n.z < Z || n.px - w < -width/2 || n.px - w > width/2 || n.py > height)
         {
            // reset flake
            fnResetFlake(n,depth);
         }

         SA += 0.00005;
      }
      G.restore();

      if (run) requestAnimFrame(rf);
   };

   requestAnimFrame(rf);
}

__xmassnow();
