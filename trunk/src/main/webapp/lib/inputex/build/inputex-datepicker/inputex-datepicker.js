/**
 * @module inputex-datepicker
 */
YUI.add("inputex-datepicker",function(Y){

   var inputEx = Y.inputEx,
       lang = Y.Lang;
/**
 * A DatePicker Field.
 * @class inputEx.DatePickerField
 * @extends inputEx.DateField
 * @constructor
 * @param {Object} options No added option for this field (same as DateField)
 * <ul>
 *   <li>calendar: yui calendar configuration object</li>
 * </ul>
 */
inputEx.DatePickerField = function(options) {
   inputEx.DatePickerField.superclass.constructor.call(this,options);
};

Y.extend(inputEx.DatePickerField, inputEx.DateField, {
   /**
    * Set the default date picker CSS classes
    * @param {Object} options Options object as passed to the constructor
    */
   setOptions: function(options) {
      inputEx.DatePickerField.superclass.setOptions.call(this, options);
      
      // Overwrite default options
      this.options.className = options.className ? options.className : 'inputEx-Field inputEx-DateField inputEx-PickerField inputEx-DatePickerField';

      this.options.readonly = lang.isUndefined(options.readonly) ? true : options.readonly;
      
      // Added options
      this.options.calendar = options.calendar || inputEx.messages.defautCalendarOpts;
   },
   
   
   
   renderOverlay: function() {
      
	   // Create overlay
      this.oOverlay = new Y.Overlay({
         visible:false,
         zIndex: 4
      });
      
      this.oOverlay.render();
      
      Y.one( Y.DOM._getWin().document ).on('click', function(e) {
         var n = e.target._node
         if(n != this.button._node && n != this.el) {
            this.oOverlay.hide();
         }
      },this );

   },
   
   
	_toggleOverlay: function(e) {
	   
	   // DON'T stop the event since it will be used to close other overlays...
	   //e.stopPropagation();

      if(!this.oOverlay) {
         this.renderOverlay();
         
         this.renderCalendar();
      }
      
      if(this.oOverlay.get('visible')) {
         this.oOverlay.hide();
      }
      else {
         
         // Show menu
         this.oOverlay.show();

         // align
         this.oOverlay.set("align", {node:this.button,  points:[Y.WidgetPositionAlign.TL, Y.WidgetPositionAlign.BL]});
      }
      
	},
   
   /**
    * Render the input field and the minical container
    */
   renderComponent: function() {
      
      inputEx.DatePickerField.superclass.renderComponent.call(this);
      
      // Create button
      this.button = Y.Node.create("<button>&nbsp;</button>").addClass("inputEx-DatePicker-button");
      this.button.appendTo(this.wrapEl);
      
            
      // Subscribe the click handler on the field only if readonly
		if(this.options.readonly) {
	      Y.one(this.el).on('click', this._toggleOverlay, this);
      }      
      
      // Subscribe to the first click
      this.button.on('click', this._toggleOverlay, this);
   },

   
   /**
    * Called ONCE to render the calendar lazily
    */
   renderCalendar: function() {
      // if already rendered, ignore call
      if (!!this.calendarRendered) return;
      
      this.calendar = new Y.Calendar({
                //height:'180px',
                width:'250px',
                showPrevMonth: true,
                showNextMonth: true,
                date: new Date(1982,11,1)});
      
      this.calendar.render( this.oOverlay.get('contentBox') );
      
      /*
      this.calendar.cfg.setProperty("DATE_FIELD_DELIMITER", "/");
      this.calendar.cfg.setProperty("MDY_DAY_POSITION", 1);
      this.calendar.cfg.setProperty("MDY_MONTH_POSITION", 2);
      this.calendar.cfg.setProperty("MDY_YEAR_POSITION", 3);
      this.calendar.cfg.setProperty("MD_DAY_POSITION", 1);
      this.calendar.cfg.setProperty("MD_MONTH_POSITION", 2);*/

      // localization
      /*if(inputEx.messages.shortMonths) this.calendar.cfg.setProperty("MONTHS_SHORT", inputEx.messages.shortMonths);
      if(inputEx.messages.months) this.calendar.cfg.setProperty("MONTHS_LONG", inputEx.messages.months);
      if(inputEx.messages.weekdays1char) this.calendar.cfg.setProperty("WEEKDAYS_1CHAR", inputEx.messages.weekdays1char);
      if(inputEx.messages.shortWeekdays) this.calendar.cfg.setProperty("WEEKDAYS_SHORT", inputEx.messages.shortWeekdays);
      
      // HACK to keep focus on calendar/overlay 
      // so overlay is not hidden when changing page in calendar
      // (inspired by YUI examples)
      var focusDay = function () {

         var oCalendarTBody = Dom.get(calendarId).tBodies[0],
            aElements = oCalendarTBody.getElementsByTagName("a"),
            oAnchor;

         if (aElements.length > 0) {
         
            Dom.batch(aElements, function (element) {
               if (Dom.hasClass(element.parentNode, "today")) {
                  oAnchor = element;
               }
            });
            
            if (!oAnchor) {
               oAnchor = aElements[0];
            }

            // Focus the anchor element using a timer since Calendar will try 
            // to set focus to its next button by default
            
            lang.later(0, oAnchor, function () {
               try {
                  oAnchor.focus();
               }
               catch(e) {}
            });
         
         }
         
      };

      // Set focus to either the current day, or first day of the month in 
      // the Calendar when the month changes (renderEvent is fired)
      this.calendar.renderEvent.subscribe(focusDay, this.calendar, true);
      
      // Open minical on correct date / month if field contains a value
      this.oOverlay.beforeShowEvent.subscribe(this.beforeShowOverlay, this, true);
      
      // Render the calendar on the right page !
      //    ->  this.calendar.render(); is not enough...
      this.beforeShowOverlay();
      
      this.calendar.selectEvent.subscribe(function (type,args,obj) {
         // HACK: stop here if called from beforeShowOverlay
         if (!!this.ignoreBeforeShowOverlayCall) { return; }
         
         this.oOverlay.hide();
         var date = args[0][0];
         var year = date[0], month = date[1], day = date[2];
         
         // set value ("updated" event fired by setValue)
         this.setValue(new Date(year,month-1, day) );
         
      }, this, true);
      
      // Unsubscribe the event so this function is called only once
      this.button.unsubscribe("click", this.renderCalendar); 
      
      this.calendarRendered = true;*/
      
      
      this.calendar.on("selectionChange", function (ev) {

            // Get the date from the list of selected
            // dates returned with the event (since only
            // single selection is enabled by default,
            // we expect there to be only one date)
            var newDate = ev.newSelection[0];

            this.setValue(newDate);
            
            this.oOverlay.hide();
          }, this);
      
		   //this.oOverlay.hide();
   },
   
   /**
  	 * Select the right date and display the right page on calendar, when the field has a value
 	 */
   beforeShowOverlay: function(e) {
	
      if (!!this.calendar) {
         
         var date = this.getValue(true), valid = this.validate();
         
         // check if valid to exclude invalid dates (that are truthy !)
         // check date to exclude empty values ('')
			if (valid && !!date) {
			   
         	// HACK: don't fire Field "updated" event when selecting date
         	this.ignoreBeforeShowOverlayCall = true;
         	// select the previous date in calendar
        		this.calendar.select(date);
				this.ignoreBeforeShowOverlayCall = false;
         	this.calendar.cfg.setProperty("pagedate",(date.getMonth()+1)+"/"+date.getFullYear());
			}

         this.calendar.render(); // refresh calendar
      }
   },

	/**
	 * Disable the field
	 */
	disable: function() {
		inputEx.DatePickerField.superclass.disable.call(this);
		this.button.set('disabled', true);
	},
	
	/**
	 * Enable the field
	 */
	enable: function() {
		inputEx.DatePickerField.superclass.enable.call(this);
		this.button.set('disabled', false);
	}
   
});

inputEx.messages.defautCalendarOpts = { navigator: true };

// Register this class as "datepicker" type
inputEx.registerType("datepicker", inputEx.DatePickerField);

}, '3.0.0a',{
requires: ['inputex-date','node-event-delegate','overlay','calendar']
});

