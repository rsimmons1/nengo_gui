/** namespace for all Nengo visualization */
var VIZ = {};

/**
 * Helper function to set the transform of an element.
 */
VIZ.set_transform = function(element, x, y) {
    element.style.webkitTransform = 
        element.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
}

/** 
 * Base class for interactive visualization
 * @constructor
 *
 * @param {dict} args - A set of constructor arguments, including:
 * @param {DOMElement} args.parent - the element to add this component to
 * @param {float} args.x - the left side of the component (in pixels)
 * @param {float} args.y - the top of the component (in pixels)
 * @param {float} args.width - the width of the component (in pixels)
 * @param {float} args.height - the height of the component (in pixels) 
 * @param {boolean} args.label_visible - whether the label should be shown
 * @param {int} args.id - the id of the server-side component to connect to
 */
VIZ.Component = function(parent, args) {
    var self = this;

    /** Create the div for the component and position it */
    this.div = document.createElement('div');
    this.div.style.width = args.width;
    this.div.style.height = args.height;
    VIZ.set_transform(this.div, args.x, args.y);
    this.div.style.position = 'fixed';
    this.div.classList.add('graph');
    parent.appendChild(this.div);
    this.parent = parent;
    
    this.label = document.createElement('div');
    this.label.classList.add('label');
    this.label.innerHTML = args.label.replace('<', '&lt;').replace('>', '&gt;');
    this.label.style.position = 'fixed';
    this.label.style.width = args.width;
    this.label.style.height = '2em';
    this.label_visible = true;
    this.div.appendChild(this.label);
    if (args.label_visible === false) {
        this.hide_label();
    }

    self.minWidth = 100;
    self.minHeight = 100;

    /** Move element to be drawn on top when clicked on */
    VIZ.max_zindex = 0;
    this.div.onmousedown = function() {
        VIZ.max_zindex++;
        this.style.zIndex = VIZ.max_zindex;
    };

    this.div.ontouchstart = this.div.onmousedown;
    
    /** Allow element to be dragged */ 
    this.div.setAttribute('data-x', args.x);
    this.div.setAttribute('data-y', args.y);
    interact(this.div)
        .draggable({
            inertia: true,
            restrict: {
                restriction: "parent",
                endOnly: true,
                elementRect: {top: 0, left: 0, bottom: 1, right: 1 }
            },
            onmove: function (event) {
                var target = event.target;
                var x = parseFloat(target.getAttribute('data-x')) + event.dx;
                var y = parseFloat(target.getAttribute('data-y')) + event.dy;
                VIZ.set_transform(target, x, y);
                target.setAttribute('data-x', x);
                target.setAttribute('data-y', y);                  
            },
            onend: function (event) {
                self.save_layout();
            }
        })

    /** Allow element to be resized */ 
    interact(this.div)
        .resizable({
            edges: { left: true, right: true, bottom: true, top: true }
            })
        .on('resizemove', function(event) {
            var target = event.target;
            var newWidth = event.rect.width;
            var newHeight = event.rect.height;
            var dx = event.deltaRect.left;
            var dy = event.deltaRect.top;
            if (newWidth < self.minWidth){
                newWidth = self.minWidth;
            }
            if (newHeight < self.minHeight){
                newHeight = self.minHeight;
            }
            target.style.width  = newWidth + 'px';
            target.style.height = newHeight + 'px';
            self.on_resize(newWidth, newHeight);
            
            var x = parseFloat(target.getAttribute('data-x')) + dx;
            var y = parseFloat(target.getAttribute('data-y')) + dy;
            VIZ.set_transform(target, x, y);
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);                  
            
        })
        .on('resizeend', function(event) {
            self.save_layout()
        });    

    /** Open a WebSocket to the server */
    this.uid = args.uid;
    if (this.uid != undefined) {
        this.ws = new WebSocket('ws://localhost:8080/viz_component?uid=' + 
                                this.uid);
        this.ws.binaryType = "arraybuffer";
        this.ws.onmessage = function(event) {self.on_message(event);}
    }

    /** flag whether there is a scheduled update that hasn't happened yet */
    this.pending_update = false;
    
    this.menu = new VIZ.Menu(self.parent);
    interact(this.div)
        .on('tap', function(event) {
            if (self.menu.visible) {
                self.menu.hide();
            } else {
                self.menu.show(event.clientX, event.clientY, self.generate_menu());
            }
            event.stopPropagation();  
        });    
};

/**
 * Method to be called when Component is resized
 */
VIZ.Component.prototype.on_resize = function(width, height) {};

/**
 * Method to be called when Component received a WebSocket message
 */
VIZ.Component.prototype.on_message = function(event) {};


VIZ.Component.prototype.generate_menu = function() {
    var self = this;
    var items = [];
    if (this.label_visible) {
        items.push(['hide label', function() {
            self.hide_label(); 
            self.save_layout();
        }]);
    } else {
        items.push(['show label', function() {
            self.show_label(); 
            self.save_layout();
        }]);    
    }
    items.push(['remove', function() {self.remove();}]);
    return items;
};

VIZ.Component.prototype.remove = function() {
    this.ws.send('remove');
    this.parent.removeChild(this.div);
}


/**
 * Schedule update() to be called in the near future.  If update() is already
 * scheduled, then do nothing.  This is meant to limit how fast update() is
 * called in the case that we are changing the data faster than whatever
 * processing is needed in update()
 */
VIZ.Component.prototype.schedule_update = function(event) {
    if (this.pending_update == false) {
        this.pending_update = true;
        var self = this;
        window.setTimeout(
            function() {
                self.pending_update = false;
                self.update()
            }, 10);
    }
}

/**
 * Do any visual updating that is needed due to changes in the underlying data
 */
VIZ.Component.prototype.update = function(event) { 
}

VIZ.Component.prototype.hide_label = function(event) { 
    if (this.label_visible) {
        this.label.style.display = 'none';
        this.label_visible = false;
    }
}

VIZ.Component.prototype.show_label = function(event) { 
    if (!this.label_visible) {
        this.label.style.display = 'inline';
        this.label_visible = true;
    }
}


VIZ.Component.prototype.layout_info = function () {
    var info = {};
    info.x = parseFloat(this.div.getAttribute('data-x'));
    info.y = parseFloat(this.div.getAttribute('data-y'));
    info.width = parseFloat(this.div.style.width);
    info.height = parseFloat(this.div.style.height);  
    info.label_visible = this.label_visible;    
    return info;
}

VIZ.Component.prototype.save_layout = function () {
    var info = this.layout_info();
    console.log(info);
    this.ws.send('config:' + JSON.stringify(info));
}


/**
 * Storage of a set of data points and associated times.
 * @constructor
 *
 * @param {int} dims - number of data points per time
 * @param {VIZ.SimControl} sim - the simulation controller
 * @param {float} synapse - the filter to apply to the data
 */
VIZ.DataStore = function(dims, sim, synapse) {
    this.synapse = synapse; /** TODO: get from VIZ.SimControl */
    this.sim = sim;
    this.times = []
    this.data = [];
    for (var i=0; i < dims; i++) {
        this.data.push([]);
    }
}

/**
 * Add a set of data.
 * @param {array} row - dims+1 data points, with time as the first one
 */
VIZ.DataStore.prototype.push = function(row) {
    /** if you get data out of order, wipe out the later data */
    if (row[0] < this.times[this.times.length - 1]) {
        var index = 0;
        while (this.times[index] < row[0]) {
            index += 1;
        }
    
        var dims = this.data.length;
        this.times.splice(index, this.times.length);
        for (var i=0; i < this.data.length; i++) {
            this.data[i].splice(index, this.data[i].length);
        }        
    }


    /** compute lowpass filter (value = value*decay + new_value*(1-decay) */
    var decay = 0.0;    
    if ((this.times.length != 0) && (this.synapse > 0)) {
        var dt = row[0] - this.times[this.times.length - 1];
        decay = Math.exp(-dt / this.synapse);
    }
    
    
    /** put filtered values into data array */
    for (var i = 0; i < this.data.length; i++) {
        if (decay == 0.0) {
            this.data[i].push(row[i + 1]);        
        } else {
            this.data[i].push(row[i + 1] * (1-decay) + 
                              this.data[i][this.data[i].length - 1] * decay);
        }
    }
    /** store the time as well */
    this.times.push(row[0]);
};

/**
 * update the data storage.  This should be call periodically (before visual
 * updates, but not necessarily after every push()).  Removes old data outside
 * the storage limit set by the VIZ.SimControl.
 */
VIZ.DataStore.prototype.update = function() {
    /** figure out how many extra values we have (values whose time stamp is
     * outside the range to keep)
     */
    var extra = 0;
    var limit = this.sim.time_slider.last_time - 
                this.sim.time_slider.kept_time;
    while (this.times[extra] < limit) {
        extra += 1;
    }

    /** remove the extra data */
    if (extra > 0) {
        this.times = this.times.slice(extra);
        for (var i = 0; i < this.data.length; i++) {
            this.data[i] = this.data[i].slice(extra);
        }
    }
}

/**
 * Return just the data that is to be shown
 */
VIZ.DataStore.prototype.get_shown_data = function() {
    /* determine time range */
    var t1 = this.sim.time_slider.first_shown_time;
    var t2 = t1 + this.sim.time_slider.shown_time;
    
    /* find the corresponding index values */
    var index = 0;
    while (this.times[index] < t1) {
        index += 1;
    }
    var last_index = index;
    while (this.times[last_index] < t2 && last_index < this.times.length) {
        last_index += 1;
    }
    this.first_shown_index = index;
    
    /** return the visible slice of the data */
    var shown = [];
    for (var i = 0; i < this.data.length; i++) {
        shown.push(this.data[i].slice(index, last_index));
    }
    return shown;
}

VIZ.DataStore.prototype.get_last_data = function() {
    /* determine time range */
    var t1 = this.sim.time_slider.first_shown_time;
    var t2 = t1 + this.sim.time_slider.shown_time;
    
    /* find the corresponding index values */
    var last_index = 0;
    while (this.times[last_index] < t2 && last_index < this.times.length - 1) {
        last_index += 1;
    }
        
    /** return the visible slice of the data */
    var shown = [];
    for (var i = 0; i < this.data.length; i++) {
        shown.push(this.data[i][last_index]);
    }
    return shown;
}


/**
 * convert colors from YUV to RGB
 */
VIZ.yuv_to_rgb = function(y, u, v) {
    var r = y + (1.370705 * v);
    var g = y - (0.698001 * v) - (0.337633 * u);
    var b = y + (1.732446 * u);    
    //var r = y + (1.13983 * v);
    //var g = y - (0.58060 * v) - (0.39465 * u);
    //var b = y + (2.03211 * u);    
    
    r = Math.round(r * 256);
    if (r < 0) r = 0;
    if (r > 255) r = 255;
    g = Math.round(g * 256);
    if (g < 0) g = 0;
    if (g > 255) g = 255;
    b = Math.round(b * 256);
    if (b < 0) b = 0;
    if (b > 255) b = 255;
        
    return ["rgb(",r,",",g,",",b,")"].join("");
}

/**
 * Generate a color sequence of a given length.
 *
 * Colors are defined via YUV.  Y (luminance, i.e. what the line will look like
 * in black-and-white) is evenly spaced from 0 to max_y (0.7).  The U, V are
 * chosen by spinning through a circle of radius color_strength, moving by
 * phi*2*pi radians each step.  This cycles through colors while keeping a large
 * separation (i.e. each angle is far away from all the other angles)
 */ 
VIZ.make_colors = function(N) {
    var c = [];
    var start_angle = 1.5;            // what color to start with
    var phi = (1 + Math.sqrt(5)) / 2; // the golden ratio
    var color_strength = 0.5;         // how bright the colors are (0=grayscale)
    var max_y = 0.7;                  // how close to white to get
    
    for (var i = 0; i < N; i++) {
        var y = 0;
        if (N > 1) {
            y = i * max_y / (N - 1);
        }
        
        var angle = start_angle - 2 * Math.PI * i * phi;
        //var angle = start_angle + 2 * Math.PI * i / N;
        var u = color_strength * Math.sin(angle);
        var v = color_strength * Math.cos(angle);
        c.push(VIZ.yuv_to_rgb(y, u, v));
    }
    return c;
}
