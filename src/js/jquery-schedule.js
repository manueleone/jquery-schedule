(function ($, window, document) {
    'use strict';

    /* global $ */

    // Defaults options
    const defaults = {
    mode: 'edit', // read
    hour: 24, // 12
    days: 7, // 7/5
    start: 0,
    end: 24,
    periodDuration: 30, // 15/30/60
    data: [],
    periodOptions: true,
    periodColors: [],
    periodTitle: '',
    periodBackgroundColor: 'rgba(82, 155, 255, 0.5)',
    periodBorderColor: '#2a3cff',
    periodTextColor: '#000',
    periodRemoveButton: 'Remove',
    periodDuplicateButton: 'Duplicate',
    periodCloseButton: 'Close',
    periodTitlePlaceholder: 'Title',
    classes: {
        table: 'table-bordered table-sm',
        modal: 'modal-default',
        input: 'form-control-sm',
        colorsButton: 'btn-sm',
        removeButton: 'btn-sm btn-danger',
        duplicateButton: 'btn-sm btn-warning',
        closeButton: 'btn-sm btn-secondary align-self-start mr-auto',
    },
    daysList: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
    ],
    onInit() {
    },
    onAddPeriod() {
    },
    onRemovePeriod() {
    },
    onDuplicatePeriod() {
    },
    onClickPeriod() {
    },
};
    const pluginName = 'jqs';

    // Plugin constructor
    function Plugin(element, options) {
    this.element = element;
    this.settings = $.extend({}, defaults, options);
    this.periodOptions = {
        title: this.settings.periodTitle,
        backgroundColor: this.settings.periodBackgroundColor,
        borderColor: this.settings.periodBorderColor,
        textColor: this.settings.periodTextColor,
    };
    this.init();
}

    $.extend(Plugin.prototype, {
    /**
     * Plugin instance seed
     */
    seed: Math.random().toString(36).substr(2),

    /**
     * Period addition counter
     */
    counter: 0,

    /**
     * Period interval multiplier
     */
    periodInterval: 0,

    /**
     * Period max height
     */
    periodHeight: 0,

    /**
     * Period position max step
     */
    periodPosition: 0,

    /**
     * Generate id for a period
     * @returns {string}
     */
    uniqId() {
        this.counter += 1;

        return `${pluginName}_${this.seed}_${this.counter}`;
    },

    /**
     * Plugin init
     */
    init() {
        const $this = this;

        // colors validation
        if (this.settings.periodColors.length > 0) {
            $.each(this.settings.periodColors, (index, color) => {
                if (!$.inArray(color) || color.length < 3) {
                    throw new Error('Invalid periodColors');
                }
            });
        }

        // duration validation
        if ($.inArray(this.settings.periodDuration, [15, 30, 60]) === -1) {
            throw new Error('Invalid periodDuration');
        }

        this.periodInterval = 60 / this.settings.periodDuration;
        this.periodHeight = 24 * this.periodInterval;
        this.periodPosition = 40 / this.periodInterval;

        $(this.element)
            .addClass(`jqs jqs-mode-${this.settings.mode} jqs-mode-${this.settings.days}`);

        // Init events
        if (this.settings.mode === 'edit') {
            let position = 0;
            let helper = false;

            $(this.element)
                .on('click', '.jqs-period-remove', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const period = $(e.currentTarget).parents('.jqs-period');

                    $this.remove(period);
                })
                .on('click', '.jqs-period-duplicate', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const period = $(e.currentTarget).parents('.jqs-period');

                    $this.duplicate(period);
                })
                .on('click', '.jqs-day-remove', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = $(e.currentTarget).parents('.jqs-grid-day').index();
                    const parent = $('.jqs-day', $this.element).eq(index);

                    $this.removeAll(parent);
                })
                .on('click', '.jqs-day-duplicate', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const index = $(e.currentTarget).parents('.jqs-grid-day').index();
                    const parent = $('.jqs-day', $this.element).eq(index);

                    $this.duplicateAll(parent);
                })
                .on('mousedown', '.jqs-day', (e) => {
                    e.preventDefault();
                    const offset = e.pageY - $(e.target).offset().top;
                    position = Math.floor(offset / $this.periodPosition);
                    if (!$(e.target).hasClass('jqs-period') && $(e.target).parents('.jqs-period').length === 0) {
                        let time = '';

                        if ($this.settings.periodDuration !== 15) {
                            time = $this.periodInit(position, position + 1);
                        }

                        helper = $('<div>').addClass('jqs-period-helper').css({
                            height: $this.periodPosition,
                            top: position * $this.periodPosition,
                        }).append(`<div class="jqs-period-helper-time">${time}</div>`);

                        $(e.currentTarget).append(helper);
                    }
                })
                .on('mousemove', '.jqs-day', (e) => {
                    e.preventDefault();
                    if (helper) {
                        const offset = e.pageY - $(e.target).offset().top;
                        let height = Math.round(offset / $this.periodPosition) - position;

                        if (height <= 0) {
                            height = 1;
                        }

                        helper.css({
                            height: height * $this.periodPosition,
                        });

                        if (height >= 1) {
                            $('.jqs-period-helper-time', helper).text($this.periodInit(position, position + height));
                        } else {
                            $('.jqs-period-helper-time', helper).text('');
                        }
                    }
                })
                .on('mouseup', '.jqs-day', (e) => {
                    e.preventDefault();
                    if (!$(e.target).hasClass('jqs-period') && $(e.target).parents('.jqs-period').length === 0) {
                        const offset = e.pageY - $(e.target).offset().top;
                        let height = Math.round(offset / $this.periodPosition) - position;
                        if (height <= 0) {
                            height = 1;
                        }

                        $this.add($(e.currentTarget), position, height);
                    }

                    position = 0;
                    if (helper) {
                        helper.remove();
                        helper = false;
                    }
                })
                .on('mouseenter', '.jqs-day', (e) => {
                    e.preventDefault();
                    const index = $(e.target).parents('td').index();
                    $('.jqs-grid-day', $this.element).eq(index).addClass('jqs-grid-day-buttons');
                })
                .on('mouseleave', '.jqs-day', (e) => {
                    e.preventDefault();
                    const index = $(e.target).parents('td').index();
                    $('.jqs-grid-day', $this.element).eq(index).removeClass('jqs-grid-day-buttons');
                });
        }

        this.create();
        this.generate();

        this.settings.onInit.call(this, this.element);
    },

    /**
     * Generate schedule structure
     */
    create() {
        $(`<table class="jqs-table table ${this.settings.classes.table}"><tr></tr></table>`).appendTo($(this.element));

        for (let i = 0; i < this.settings.days; i += 1) {
            $('<td><div class="jqs-day"></div></td>')
                .appendTo($('.jqs-table tr', this.element));
        }

        $('<div class="jqs-grid"><div class="jqs-grid-head"></div></div>').appendTo($(this.element));

        for (let j = this.settings.start; j < (this.settings.end + 1); j += 1) {
            $(`<div class="jqs-grid-line"><div class="jqs-grid-hour">${this.formatHour(j)}</div></div>`)
                .appendTo($('.jqs-grid', this.element));
        }

        let dayRemove = '';
        let dayDuplicate = '';
        if (this.settings.mode === 'edit') {
            dayRemove = `<div class="jqs-day-remove" title="${this.settings.periodRemoveButton}"></div>`;
            dayDuplicate = `<div class="jqs-day-duplicate" title="${this.settings.periodDuplicateButton}"></div>`;
        }

        for (let k = 0; k < this.settings.days; k += 1) {
            $(`<div class="jqs-grid-day">${this.settings.daysList[k]}${dayRemove}${dayDuplicate}</div>`)
                .appendTo($('.jqs-grid-head', this.element));
        }
    },

    /**
     * Generate periods from data option
     */
    generate() {
        if (this.settings.data.length > 0) {
            const $this = this;

            $.each(this.settings.data, (i, data) => {
                $.each(data.periods, (j, period) => {
                    const parent = $('.jqs-day', $this.element).eq(data.day);
                    let options = {};
                    let height;
                    let position;
                    if ($.isArray(period)) {
                        position = $this.positionFormat(period[0]);
                        height = $this.positionFormat(period[1]);
                    } else {
                        position = $this.positionFormat(period.start);
                        height = $this.positionFormat(period.end);
                        options = period;
                    }

                    if (height === 0) {
                        height = $this.periodHeight;
                    }

                    $this.add(parent, position, height - position, options);
                });
            });
        }
    },

    /**
     * Add a period to a day
     * @param parent
     * @param {int} position
     * @param {int} height
     * @param params
     */
    add(parent, position, height, params) {
        if (height <= 0 || position >= this.periodHeight) {
            console.error('Invalid period');

            return false;
        }

        const options = $.extend({}, this.periodOptions, params);

        // new period
        let periodRemove = '';
        let periodDuplicate = '';
        if (this.settings.mode === 'edit') {
            periodRemove = `<div class="jqs-period-remove" title="${this.settings.periodRemoveButton}"></div>`;
            periodDuplicate = `<div class="jqs-period-duplicate" title="${this.settings.periodDuplicateButton}"></div>`;
        }

        const periodTitle = `<div class="jqs-period-title">${options.title}</div>`;
        const periodTime = `<div class="jqs-period-time">${this.periodInit(position, position + height)}</div>`;
        const period = $(`${'<div class="jqs-period">' +
            '<div class="jqs-period-container">'}${periodTime}${periodTitle}${periodRemove}${periodDuplicate}</div>` +
            '</div>').css({
            top: position * this.periodPosition,
            height: height * this.periodPosition,
        }).attr('id', this.uniqId()).attr('title', options.title)
            .appendTo(parent);

        $('.jqs-period-container', period).css({
            'background-color': options.backgroundColor,
            'border-color': options.borderColor,
            color: options.textColor,
        });

        // period validation
        if (!this.isValid(period)) {
            console.error('Invalid period', this.periodInit(position, position + height));

            $(period).remove();

            return false;
        }

        // text format
        this.periodText(period);

        // period events
        if (this.settings.mode === 'edit') {
            const $this = this;

            period.draggable({
                grid: [0, this.periodPosition],
                containment: 'parent',
                drag(e, ui) {
                    $('.jqs-period-time', ui.helper).text($this.periodDrag(ui));
                    $this.closeOptions();
                },
                stop(e, ui) {
                    if (!$this.isValid($(ui.helper))) {
                        console.error('Invalid position');

                        $(ui.helper).css('top', Math.round(ui.originalPosition.top));
                    }
                },
            }).resizable({
                grid: [0, this.periodPosition],
                containment: 'parent',
                handles: 'n, s',
                resize(e, ui) {
                    $('.jqs-period-time', ui.helper).text($this.periodResize(ui));

                    $this.periodText(period);
                    $this.closeOptions();
                },
                stop(e, ui) {
                    if (!$this.isValid($(ui.helper))) {
                        console.error('Invalid position');

                        $(ui.helper).css({
                            height: Math.round(ui.originalSize.height),
                            top: Math.round(ui.originalPosition.top),
                        });
                    }
                },
            });

            if (this.settings.periodOptions) {
                period.on('click', (e) => {
                    e.preventDefault();
                    if (
                        !$(e.currentTarget).hasClass('jqs-period-remove') ||
                        !$(e.currentTarget).hasClass('jqs-period-duplicate')
                    ) {
                        $this.settings.onClickPeriod.call(this, e, period, $this.element);
                        $this.openOptions(e, period);
                    }
                });
            }
        }

        this.settings.onAddPeriod.call(this, period, this.element);

        return true;
    },

    /**
     * Remove a period
     * @param period
     */
    remove(period) {
        if (!this.settings.onRemovePeriod.call(this, period, this.element)) {
            period.remove();
            this.closeOptions();
        }
    },

    /**
     * Remove all periods in the parent container
     * @param parent
     */
    removeAll(parent) {
        const $this = this;
        $('.jqs-period', parent).each((index, period) => {
            $this.remove(period);
        });
    },

    /**
     * Duplicate a period
     * @param period
     */
    duplicate(period) {
        if (!this.settings.onDuplicatePeriod.call(this, period, this.element)) {
            const options = this.periodData(period);
            const position = Math.round(period.position().top / this.periodPosition);
            const height = Math.round(period.height() / this.periodPosition);

            const $this = this;
            $('.jqs-day', this.element).each((index, parent) => {
                $this.add(parent, position, height, options);
            });

            this.closeOptions();
        }
    },

    /**
     * Duplicate all periods in the parent container
     * @param parent
     */
    duplicateAll(parent) {
        const $this = this;
        $('.jqs-period', parent).each((index, period) => {
            $this.duplicate($(period));
        });
    },

    /**
     * Open the options popup
     * @param event
     * @param period
     */
    openOptions(event, period) {
        const $this = this;
        $this.closeOptions();

        // time
        const position = Math.round(period.position().top / this.periodPosition);
        const height = Math.round(period.height() / this.periodPosition);
        const time = `<div class="jqs-options-time">${this.periodInit(position, position + height)}</div>`;

        // title
        const title = $('jqs-period-title', period).text();
        const titleInput = `${'<div class="jqs-options-title-container">' +
        '<input type="text" placeholder="'}${this.settings.periodTitlePlaceholder}" value="${title}" class="jqs-options-title form-control ${this.settings.classes.input}"></div>`;

        // color
        let colorInput = '';
        if (this.settings.periodColors && this.settings.periodColors.length > 0) {
            colorInput = '<div class="jqs-options-color-container mt-2 btn-group d-flex" role="group">';
            $.each(this.settings.periodColors, (index, color) => {
                colorInput += `<button class="jqs-options-color w-100 btn ${this.settings.classes.colorsButton}" 
                                 style="background-color: ${color[0]}; border-color: ${color[1]}; color:${color[2]}">
                            ${color[3]}
                         </button>`;
            });
            colorInput += '</div>';
        }

        // button
        const remove = `<button type="button" class="jqs-options-remove btn ${this.settings.classes.removeButton}" 
                              data-dismiss="modal">${this.settings.periodRemoveButton}</button>`;
        const duplicate = `<button type="button" class="jqs-options-duplicate btn ${this.settings.classes.duplicateButton}" 
                             data-dismiss="modal">${this.settings.periodDuplicateButton}</button>`;
        const close = `<button type="button" class="jqs-options-close btn ${this.settings.classes.closeButton}" 
                             data-dismiss="modal">${this.settings.periodCloseButton}</button>`;
        const body = `<div class="modal-dialog" role="document">
                      <div class="modal-content">
                        <div class="modal-header">
                          <h5 class="modal-title">${time}</h5>
                          <button type="button" class="close" data-dismiss="modal" aria-label="${this.settings.periodCloseButton}">
                            <span aria-hidden="true">&times;</span>
                          </button>
                        </div>
                        <div class="modal-body">
                          <p>${titleInput}${colorInput}</p>
                        </div>
                        <div class="modal-footer">
                            ${close}${remove}${duplicate}
                        </div>
                      </div>
                    </div>`;
        $(`<div class="jqs-options modal ${this.settings.classes.modal}" tabindex="-1" role="dialog">${body}</div>`)
            .appendTo(this.element)
            .modal('show');

        $('.jqs-options-color', this.element).on('click', (e) => {
            e.preventDefault();
            $('.jqs-period-container', period).css({
                'background-color': $(e.currentTarget).css('background-color'),
                'border-color': $(e.currentTarget).css('border-top-color'),
                color: $(e.currentTarget).css('color'),
            });
        });

        $('.jqs-options-title', this.element).on('keyup', (e) => {
            e.preventDefault();
            $('.jqs-period-title', period).text($(e.currentTarget).val());
            period.attr('title', $(e.currentTarget).val());
        });

        $('.jqs-options-remove', this.element).on('click', (e) => {
            e.preventDefault();
            $this.remove(period);
        });

        $('.jqs-options-duplicate', this.element).on('click', (e) => {
            e.preventDefault();
            $this.duplicate(period);
        });

        $('.jqs-options-close', this.element).on('click', (e) => {
            e.preventDefault();
            $this.closeOptions();
        });
    },

    /**
     * Close the options popup
     */
    closeOptions() {
        $('.jqs-options', this.element).modal('hide');
    },

    /**
     * Return a readable period string from a period position
     * @param start
     * @param end
     * @returns {string}
     */
    periodInit(start, end) {
        return `${this.periodFormat(start)} - ${this.periodFormat(end)}`;
    },

    /**
     * Return a readable period string from a drag event
     * @param ui
     * @returns {string}
     */
    periodDrag(ui) {
        const start = Math.round(ui.position.top / this.periodPosition);
        const end = Math.round(($(ui.helper).height() + ui.position.top) / this.periodPosition);

        return `${this.periodFormat(start)} - ${this.periodFormat(end)}`;
    },

    /**
     * Return a readable period string from a resize event
     * @param ui
     * @returns {string}
     */
    periodResize(ui) {
        const start = Math.round(ui.position.top / this.periodPosition);
        const end = Math.round((ui.size.height + ui.position.top) / this.periodPosition);

        return `${this.periodFormat(start)} - ${this.periodFormat(end)}`;
    },

    /**
     *
     * @param period
     */
    periodText(period) {
        const height = period.height();
        period.removeClass('jqs-period-15').removeClass('jqs-period-30');

        if (height === 10) {
            period.addClass('jqs-period-15');
            return false;
        }

        if (height === 20) {
            period.addClass('jqs-period-30');
            return false;
        }

        const newHeight = Math.floor((height - 16 - 4) / 12) * 12;
        $('.jqs-period-title', period).height(newHeight);

        return true;
    },

    /**
     * Return an object with all period data
     * @param period
     * @returns {[*,*]}
     */
    periodData(period) {
        const start = Math.round(period.position().top / this.periodPosition);
        const end = Math.round((period.height() + period.position().top) / this.periodPosition);

        return {
            start: this.periodFormat(start),
            end: this.periodFormat(end),
            title: $('.jqs-period-title', period).text(),
            backgroundColor: $('.jqs-period-container', period).css('background-color'),
            borderColor: $('.jqs-period-container', period).css('border-top-color'),
            textColor: $('.jqs-period-container', period).css('color'),
        };
    },

    /**
     * Return a readable hour from a position
     * @param position
     * @returns {number}
     */
    periodFormat(y) {
        let position = y;
        if (y >= this.periodHeight) {
            position = 0;
        }

        if (position < 0) {
            position = 0;
        }

        let hour = Math.floor(position / this.periodInterval);
        let mn = ((position / this.periodInterval) - hour) * 60;

        if (this.settings.hour === 12) {
            let time = hour;
            let ind = '';

            if (hour >= 12) {
                ind = 'p';
            }
            if (hour > 12) {
                time = hour - 12;
            }
            if (hour === 0 || hour === 24) {
                ind = '';
                time = 12;
            }
            if (mn !== 0) {
                time += `:${mn}`;
            }

            return time + ind;
        }

        if (hour < 10) {
            hour = `0${hour}`;
        }
        if (mn < 10) {
            mn = `0${mn}`;
        }

        return `${hour}:${mn}`;
    },

    /**
     * Return a position from a readable hour
     * @param time
     * @returns {number}
     */
    positionFormat(time) {
        const split = time.split(':');
        let hour = parseInt(split[0], 10);
        let mn = parseInt(split[1], 10);

        if (this.settings.hour === 12) {
            const matches = time.match(/([0-1]?[0-9]):?([0-5][0-9])?\s?(am|pm|p)?/);
            let ind = matches[3];
            if (!ind) {
                ind = 'am';
            }

            hour = parseInt(matches[1], 10);
            mn = parseInt(matches[2], 10);

            if (!mn) {
                mn = 0;
            }

            if (hour === 12 && ind === 'am') {
                hour = 0;
            }
            if (hour === 12 && (ind === 'pm' || ind === 'p')) {
                ind = 'am';
            }
            if (ind === 'pm' || ind === 'p') {
                hour += 12;
            }
        }

        let position = 0;
        position += (hour * this.periodInterval);
        position += (mn / (60 * this.periodInterval));

        if (Math.floor(position) !== position) {
            position = (
                position - Math.floor(position) < 0.1
                    ? Math.floor(position) + 1
                    : Math.floor(position) + 2
            );
        }

        return position;
    },

    /**
     * Return a hour to readable format (Grid structure)
     * @param hour
     * @returns {string}
     */
    formatHour(h) {
        let hour = h;
        if (this.settings.hour === 12) {
            switch (hour) {
            case 0:
            case 24:
                hour = '12am';
                break;
            case 12:
                hour = '12pm';
                break;
            default:
                if (hour > 12) {
                    hour = `${hour - 12}pm`;
                } else {
                    hour += 'am';
                }
            }
        } else {
            if (hour >= 24) {
                hour = 0;
            }

            if (hour < 10) {
                hour = `0${hour}`;
            }
            hour += ':00';
        }

        return hour;
    },

    /**
     * Check if a period is valid
     * @param current
     * @returns {boolean}
     */
    isValid(current) {
        const currentStart = Math.round(current.position().top);
        const currentEnd = Math.round(current.position().top + current.height());

        let start = 0;
        let end = 0;
        let check = true;
        $('.jqs-period', $(current).parent()).each((index, period) => {
            if (current.attr('id') !== $(period).attr('id')) {
                start = Math.round($(period).position().top);
                end = Math.round($(period).position().top + $(period).height());

                if (start > currentStart && start < currentEnd) {
                    check = false;
                }

                if (end > currentStart && end < currentEnd) {
                    check = false;
                }

                if (start < currentStart && end > currentEnd) {
                    check = false;
                }

                if (start === currentStart || end === currentEnd) {
                    check = false;
                }
            }
        });

        return check;
    },

    /**
     * Export data to JSON string
     * @returns {string}
     */
    export() {
        const $this = this;
        const data = [];

        $('.jqs-day', $this.element).each((i, day) => {
            const periods = [];
            $('.jqs-period', day).each((j, period) => {
                periods.push($this.periodData($(period)));
            });

            data.push({
                day: i,
                periods,
            });
        });

        return JSON.stringify(data);
    },

    /**
     * Import data on plugin init
     * @param dataImport
     * @returns {Array}
     */
    import(dataImport) {
        const $this = this;
        const ret = [];
        $.each(dataImport, (i, data) => {
            // console.log(i, data);
            $.each(data.periods, (j, period) => {
                const parent = $('.jqs-day', $this.element).eq(data.day);
                let options = {};
                let height;
                let position;

                if ($.isArray(period)) {
                    position = $this.positionFormat(period[0]);
                    height = $this.positionFormat(period[1]);
                } else {
                    position = $this.positionFormat(period.start);
                    height = $this.positionFormat(period.end);
                    options = period;
                }

                console.log(i, period, position, height);

                if (height === 0) {
                    height = $this.periodHeight;
                }

                let status = true;
                if (!$this.add(parent, position, height - position, options)) {
                    status = false;
                }

                ret.push({
                    day: data.day,
                    period: [
                        $this.periodFormat(position),
                        $this.periodFormat(height),
                    ],
                    status,
                });
            });
        });

        return JSON.stringify(ret);
    },

    /**
     * Remove all periods
     */
    reset() {
        this.removeAll(this.element);
    },
});

    $.fn[pluginName] = function init(options, ...args) {
    let ret = false;
    const $this = this;
    const loop = $this.each((i, el) => {
        if (!$.data(el, `plugin_${pluginName}`)) {
            $.data(el, `plugin_${pluginName}`, new Plugin(this, options));
        } else if ($.isFunction(Plugin.prototype[options])) {
            ret = $.data(el, `plugin_${pluginName}`)[options](args[0]);
        }
    });

    if (ret) {
        return ret;
    }

    return loop;
};

}(jQuery, window, document));
