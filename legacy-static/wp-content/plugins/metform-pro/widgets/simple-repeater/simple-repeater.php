<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Input_Simple_Repeater extends Widget_Base{

    use \MetForm\Traits\Conditional_Controls;

    public function __construct( $data = [], $args = null ) {
		parent::__construct( $data, $args );

		$this->add_script_depends('metform-repeater');

		$this->add_style_depends('mf-select2');
		$this->add_script_depends('mf-select2');

		$this->add_style_depends('asRange');
		$this->add_script_depends('asRange');

		if ( class_exists('\Elementor\Icons_Manager') && method_exists('\Elementor\Icons_Manager', 'enqueue_shim') ) {
			\Elementor\Icons_Manager::enqueue_shim();
		}
	}

    public function get_name() {
		return 'mf-simple-repeater';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_simple_repeater';
	}

	public function get_title() {
		return esc_html__( 'Simple repeater', 'metform-pro' );
	}

	public function has_widget_inner_wrapper(): bool {
		return ! Plugin::$instance->experiments->is_feature_active('e_optimized_markup');
	}

	public function show_in_panel() {
        return 'metform-form' == get_post_type();
	}

	public function get_categories() {
		return [ 'metform-pro' ];
	}

	public function get_keywords() {
        return ['metform-pro', 'input', 'repeater', 'repeated fields', 'multiple fields'];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list/#simple-repeater';
    }

    protected function register_controls() {

        $this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'Content', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'mf_input_label_status',
			[
				'label' => esc_html__( 'Show Label', 'metform-pro' ),
				'type' => Controls_Manager::SWITCHER,
				'on' => esc_html__( 'Show', 'metform-pro' ),
				'off' => esc_html__( 'Hide', 'metform-pro' ),
				'return_value' => 'yes',
				'default' => 'yes',
				'description' => esc_html__('for adding label on input turn it on. Don\'t want to use label? turn it off.', 'metform-pro'),
			]
		);

		$this->add_control(
			'mf_input_label_display_property',
			[
				'label' => esc_html__( 'Position', 'metform-pro' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'block',
				'options' => [
					'block' => esc_html__( 'Top', 'metform-pro' ),
					'inline-block' => esc_html__( 'Left', 'metform-pro' ),
				],
				'selectors' => [
					'{{WRAPPER}} .mf-repeater-field-label,
					{{WRAPPER}} .mf-repeater-field,
					{{WRAPPER}} .mf-checkbox,
					{{WRAPPER}} .mf-radio,
					{{WRAPPER}} .mf-input-switch-control' => 'display: {{VALUE}}',
				],
				'description' => esc_html__('Select label position. where you want to see it. top of the input or left of the input.', 'metform-pro'),

			]
		);

		$this->add_control(
            'mf_input_label_display_layout',
            [
                'label' => esc_html__( 'Layout', 'metform-pro' ),
                'type' => Controls_Manager::SELECT,
                'default' => 'block',
                'options' => [
                    'block' => esc_html__( 'Block', 'metform-pro' ),
                    'inline' => esc_html__( 'Inline', 'metform-pro' ),
                ],
            ]
        );

		$this->add_control(
			'mf_input_label',
			[
				'label' => esc_html__( 'Label : ', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
				'default' => $this->get_title(),
				'title' => esc_html__( 'Enter here label of input', 'metform-pro' ),
				'condition'    => [
					'mf_input_label_status' => 'yes',
				],
			]
		);

		$this->add_control(
			'mf_input_name',
			[
				'label' => esc_html__( 'Name', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
				'default' => $this->get_name(),
				'title' => esc_html__( 'Enter here name of the input', 'metform-pro' ),
				'description' => esc_html__('Name is must required. Enter name without space or any special character. use only underscore/ hyphen (_/-) for multiple word. Name must be different.', 'metform-pro'),
			]
		);

		$this->add_control(
			'mf_input_repeater_btn_icon_status', [
				'label' => esc_html__( 'Use icon inside button ?', 'metform-pro' ),
				'type' => Controls_Manager::SWITCHER,
				'yes' => esc_html__( 'Yes', 'metform-pro' ),
				'no' => esc_html__( 'No', 'metform-pro' ),
				'return_value' => 'yes',
				'default' => 'yes',
			]
        );

		$this->add_control(
			'mf_input_repeater_add_btn_txt',
			[
				'label' =>esc_html__( 'Add button text', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
				'default' =>esc_html__( 'Add', 'metform-pro' )
			]
		);

		$this->add_control(
			'mf_input_repeater_remove_btn_txt',
			[
				'label' =>esc_html__( 'Remove button text', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
				'default' =>esc_html__( 'Delete', 'metform-pro' ),
			]
		);

		$this->add_control(
			'mf_input_repeater_add_btn_icon',
			[
				'label' =>esc_html__( 'Add button icon', 'metform-pro' ),
				'type' => Controls_Manager::ICONS,
				'default' => [
					'value' => 'fas fa-plus',
					'library' => 'solid',
				],
				'condition' => [
					'mf_input_repeater_btn_icon_status' => 'yes',
				],
			]
		);

		$this->add_control(
			'mf_input_repeater_remove_btn_icon',
			[
				'label' =>esc_html__( 'Remove button icon', 'metform-pro' ),
				'type' => Controls_Manager::ICONS,
				'default' => [
					'value' => 'far fa-trash-alt',
					'library' => 'reguler',
				],
				'condition' => [
					'mf_input_repeater_btn_icon_status' => 'yes',
				],
			]
		);

        $repeater = new Repeater();

		$repeater->add_control(
			'mf_input_repeater_label_status', [
				'label' => esc_html__( 'Show label of repeater', 'metform-pro' ),
				'type' => Controls_Manager::SWITCHER,
				'yes' => esc_html__( 'Show', 'metform-pro' ),
				'no' => esc_html__( 'Hide', 'metform-pro' ),
				'return_value' => 'yes',
				'default' => 'yes',
			]
        );

		$repeater->add_control(
			'mf_input_repeater_label', [
				'label' => esc_html__( 'Repeater input label', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
				'default' => esc_html__( 'Label' , 'metform-pro' ),
				'label_block' => true,
				'condition' => [
                    'mf_input_repeater_label_status' => 'yes',
                ],
			]
        );

		$repeater->add_control(
			'mf_input_repeater_type',
			[
				'label' => esc_html__( 'Input Type', 'metform-pro' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'text',
				'options' => [
					'text'  => esc_html__( 'Text', 'metform-pro' ),
					'number' => esc_html__( 'Number', 'metform-pro' ),
					'email' => esc_html__( 'Email', 'metform-pro' ),
					'url' => esc_html__( 'Url', 'metform-pro' ),
					'switch' => esc_html__( 'Switch', 'metform-pro' ),
					'range' => esc_html__( 'Range', 'metform-pro' ),
					'checkbox' => esc_html__( 'Checkbox', 'metform-pro' ),
					'radio' => esc_html__( 'Radio', 'metform-pro' ),
					'select' => esc_html__( 'Select', 'metform-pro' ),
					'textarea' => esc_html__( 'Textarea', 'metform-pro' ),
				],
			]
		);

		$repeater->add_control(
			'mf_input_repeater_name',
			[
				'label' => esc_html__( 'Input Name', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
                'placeholder' => esc_html__( 'Repeated input field name', 'metform-pro' ),
                'default' => 'repeater-input-name-'.time(),
			]
        );

		$repeater->add_control(
			'mf_input_repeater_range_min',
			[
				'label' => esc_html__( 'Min value', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
                'placeholder' => esc_html__( 'Min value for range', 'metform-pro' ),
				'default' => '1',
				'condition' => [
                    'mf_input_repeater_type' => ['range'],
                ]
			]
        );

		$repeater->add_control(
			'mf_input_repeater_range_max',
			[
				'label' => esc_html__( 'Max value', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
                'placeholder' => esc_html__( 'Max value for range', 'metform-pro' ),
				'default' => '100',
				'condition' => [
                    'mf_input_repeater_type' => ['range'],
                ]
			]
        );

		$repeater->add_control(
			'mf_input_repeater_range_step',
			[
				'label' => esc_html__( 'Increment step', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
                'placeholder' => esc_html__( 'step', 'metform-pro' ),
				'default' => '1',
				'condition' => [
                    'mf_input_repeater_type' => ['range'],
                ]
			]
        );

		$repeater->add_control(
			'mf_input_repeater_placeholder',
			[
				'label' => esc_html__( 'Input Placeholder', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
                'placeholder' => esc_html__( 'Repeated input field placeholder', 'metform-pro' ),
				'default' => 'place holder',
				'condition' => [
                    'mf_input_repeater_type!' => ['checkbox', 'radio', 'select', 'switch', 'range'],
                ]
			]
        );

		$repeater->add_control(
			'mf_input_repeater_option',
			[
				'label' => esc_html__( 'Input options', 'metform-pro' ),
				'type' => Controls_Manager::TEXTAREA,
				'rows' => 10,
				'placeholder' => esc_html__( 'Option 1|value-1', 'metform-pro' ),
                'condition' => [
                    'mf_input_repeater_type' => ['checkbox', 'radio', 'select'],
                ]
			]
		);

		$repeater->add_control(
			'mf_input_repeater_option_note',
			[
				'label' => esc_html__( 'Rules for options: ', 'metform-pro' ),
				'type' => Controls_Manager::RAW_HTML,
				'raw' => esc_html__( 'Enter here options for input. Use new line for different option.<br> Ex: <br>Option 1<br>Option 2<br> To specify value follow below example.<br>Option 1|value-1<br>Option 2|value-2', 'metform-pro' ),
				'content_classes' => 'mf-repeater-field-option-notice',
				'condition' => [
                    'mf_input_repeater_type' => ['checkbox', 'radio', 'select'],
                ]
			]
		);

		$this->add_control(
			'mf_input_repeater',
			[
				'label' => esc_html__( 'Repeater Input List', 'metform-pro' ),
				'type' => Controls_Manager::REPEATER,
				'fields' => $repeater->get_controls(),
				'default' => [
					[
						'mf_input_repeater_label' => esc_html__( 'Text', 'metform-pro' ),
						'mf_input_repeater_type' => 'text',
					],
				],
				'title_field' => '{{{ mf_input_repeater_label }}} {{{ mf_input_repeater_type }}}',
			]
		);

		$this->add_control(
			'mf_input_help_text',
			[
				'label' => esc_html__( 'Help Text : ', 'metform-pro' ),
				'type' => Controls_Manager::TEXTAREA,
				'rows' => 3,
				'placeholder' => esc_html__( 'Type your help text here', 'metform-pro' ),
			]
		);

        $this->end_controls_section();

		if(class_exists('\MetForm_Pro\Base\Package')){
			$this->input_conditional_control();
		}

        $this->start_controls_section(
			'label_section',
			[
				'label' => esc_html__( 'Repeater Label', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
        );

		$this->add_control(
			'mf_input_label_color',
			[
                'label' => esc_html__( 'Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-input-label' => 'color: {{VALUE}}',
				],
				'default' => '#000000',
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
		);
		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_input_label_typography',
				'label' => esc_html__( 'Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-input-label',
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
		);
		$this->add_responsive_control(
			'mf_input_label_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-input-label' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
		);
		$this->add_responsive_control(
			'mf_input_label_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-input-label' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
				'condition'    => [
                    'mf_input_label_status' => 'yes',
                ],
			]
		);

		$this->add_control(
			'mf_input_required_indicator_color',
			[
				'label' => esc_html__( 'Required Indicator Color:', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'default' => '#f00',
				'selectors' => [
					'{{WRAPPER}} .mf-input-required-indicator, {{WRAPPER}} .mf-error-message' => 'color: {{VALUE}}',
				],
				'condition'    => [
                    'mf_input_required' => 'yes',
                ],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'mf_reapeter_field_label_section',
			[
				'label'	=> esc_html__('Field Label', 'metform-pro'),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_control(
			'mf_field_input_label_width',
			[
				'label' => esc_html__( 'Width', 'metform-pro' ),
				'type' => Controls_Manager::SLIDER,
				'size_units' => [ 'px' ],
				'range' => [
					'px' => [
						'min' => 0,
						'max' => 1000,
						'step' => 5,
					]
				],
				'default' => [
					'unit' => '%',
					'size' => 20,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-repeater-field-label' => 'width: {{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .mf-repeater-field' => 'width: calc(100% - {{SIZE}}{{UNIT}} - 7px)',
					'{{WRAPPER}} .mf-checkbox, {{WRAPPER}} .mf-radio, {{WRAPPER}} .mf-input-switch-control' => 'width: calc(100% - {{SIZE}}{{UNIT}} - 7px)',
					'{{WRAPPER}} .range-slider' => 'width: calc(100% - {{SIZE}}{{UNIT}} - 7px)',
					'{{WRAPPER}} .mf-input-wrapper .flatpickr-calendar, {{WRAPPER}} .mf-input-wrapper .flatpickr-calendar.hasTime.noCalendar' => 'left: {{SIZE}}{{UNIT}} !important',
					'{{WRAPPER}} .select2-container, {{WRAPPER}} .mf-input-select' => 'width: calc(100% - {{SIZE}}{{UNIT}} - 7px) !important',
				],
				'condition'    => [
                    'mf_input_label_display_property' => 'inline-block',
                ],
			]
		);

		$this->add_control(
			'mf_field_input_label_color',
			[
                'label' => esc_html__( 'Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-repeater-field-label' => 'color: {{VALUE}}',
				],
				'default' => '#000000',
			]
		);
		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_field_input_label_typography',
				'label' => esc_html__( 'Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-repeater-field-label',
			]
		);
		$this->add_responsive_control(
			'mf_field_input_label_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-repeater-field-label' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);
		$this->add_responsive_control(
			'mf_field_input_label_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-repeater-field-label' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_control(
			'mf_field_input_required_indicator_color',
			[
				'label' => esc_html__( 'Required Indicator Color:', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'default' => '#f00',
				'selectors' => [
					'{{WRAPPER}} .mf-repeater-field-label .mf-input-required-indicator' => 'color: {{VALUE}}',
				],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'mf_reapeter_field_section',
			[
				'label'	=> esc_html__('Field Input', 'metform-pro'),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_responsive_control(
			'mf_field_input_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-repeater-field' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					'{{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single, {{WRAPPER}} .select2-container--default .select2-search--dropdown .select2-search__field, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					'{{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered, {{WRAPPER}} .mf-input-wrapper .range-slider' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}} !important',
				],
			]
		);
		$this->add_responsive_control(
			'mf_field_input_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-repeater-field' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					' {{WRAPPER}} .select2-container--open .select2-dropdown--below' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					'{{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered, {{WRAPPER}} .mf-input-wrapper .range-slider, {{WRAPPER}} .mf-input-switch, {{WRAPPER}} .mf-checkbox-option, {{WRAPPER}} .mf-radio-option' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};'
				],
			]
		);


		$this->add_responsive_control(
            'mf_field_input_spacing',
            [
                'label' => esc_html__( 'Input Spacing', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%'],
                'range' => [
                    '%' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .mf-input-repeater-content.mf-repeater-layout-inline .attr-form-group' => 'padding-right: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'mf_input_label_display_layout' => 'inline',
                ],
            ]
        );


			$this->start_controls_tabs( 'mf_field_input_tabs_style' );

			$this->start_controls_tab(
				'mf_field_input_tabnormal',
				[
					'label' =>esc_html__( 'Normal', 'metform-pro' ),
				]
			);

			$this->add_control(
				'mf_field_input_color',
				[
					'label' => esc_html__( 'Input Color', 'metform-pro' ),
					'type' => Controls_Manager::COLOR,
					'global' => [
						'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
					],
					'selectors' => [
						'{{WRAPPER}} .mf-repeater-field' 				=> 'color: {{VALUE}}',

						'{{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single .select2-selection__rendered, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option'	=> 'color: {{VALUE}}',

						'{{WRAPPER}} .mf-input-wrapper .asRange .asRange-pointer:before, {{WRAPPER}} .mf-input-wrapper .asRange .asRange-pointer .asRange-tip:before, {{WRAPPER}} .mf-input-wrapper .asRange .asRange-selected' => 'background-color: {{VALUE}}',
						'{{WRAPPER}} .mf-input-wrapper .asRange .asRange-pointer .asRange-tip'	=> 'background-color: {{VALUE}}; border-color: {{VALUE}}',
						'{{WRAPPER}} .mf-input-file-upload-label' => 'color: {{VALUE}};',
						'{{WRAPPER}} .mf-input-file-upload-label svg path'	=> 'stroke: {{VALUE}}; fill: {{VALUE}};',
						'{{WRAPPER}} .mf-checkbox-option input[type="checkbox"] + span, {{WRAPPER}} .mf-checkbox-option input[type="checkbox"] + span:before, {{WRAPPER}} .mf-radio-option input[type="radio"] + span, {{WRAPPER}} .mf-radio-option input[type="radio"] + span:before' => 'color: {{VALUE}};',
					],
					'default' => '#000000',
				]
			);


			$this->add_group_control(
				Group_Control_Background::get_type(),
				[
					'name' => 'mf_field_input_background',
					'label' => esc_html__( 'Background', 'metform-pro' ),
					'types' => [ 'classic', 'gradient' ],
					'selector' => '{{WRAPPER}} .mf-repeater-field, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option, {{WRAPPER}} span.select2-dropdown, {{WRAPPER}} span.select2-dropdown input, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--multiple .select2-selection__choice, {{WRAPPER}} .select2-container--default .select2-selection--multiple .select2-selection__choice__remove, {{WRAPPER}} .mf-input-file-upload-label, {{WRAPPER}} .mf-input-wrapper .asRange .asRange-selected, {{WRAPPER}} .mf-input-wrapper .asRange .asRange-pointer .asRange-tip, {{WRAPPER}} .mf-input-wrapper .asRange .asRange-pointer .asRange-tip:before, {{WRAPPER}} .mf-input-wrapper .asRange .asRange-pointer .asRange-tip:before, {{WRAPPER}} .mf-input-control:checked~.mf-input-control-label::before',
				]
			);

			$this->add_group_control(
				Group_Control_Border::get_type(),
				[
					'name' => 'mf_field_input_border',
					'label' => esc_html__( 'Border', 'metform-pro' ),
					'selector' => '{{WRAPPER}} .mf-repeater-field, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single, {{WRAPPER}} .select2-container--default .select2-search--dropdown .select2-search__field, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered, {{WRAPPER}} .select2-container--default .select2-results>.select2-results__options, {{WRAPPER}} .mf-input-file-upload-label',
				]
			);



			$this->end_controls_tab();

			$this->start_controls_tab(
				'mf_field_input_tabhover',
				[
					'label' =>esc_html__( 'Hover', 'metform-pro' ),
				]
			);

			$this->add_control(
				'mf_field_input_color_hover',
				[
					'label' => esc_html__( 'Input Color', 'metform-pro' ),
					'type' => Controls_Manager::COLOR,
					'global' => [
						'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
					],
					'selectors' => [
						'{{WRAPPER}} .mf-repeater-field:hover' => 'color: {{VALUE}}',
						'{{WRAPPER}} .mf-input-wrapper:hover .select2-container--default .select2-selection--single .select2-selection__rendered, {{WRAPPER}} .mf-input-wrapper:hover ul.select2-results__options .select2-results__option'	=> 'color: {{VALUE}}',

						'{{WRAPPER}} .mf-file-upload-container:hover .mf-input-file-upload-label svg path' => 'stroke:{{VALUE}}; fill: {{VALUE}}',

						'{{WRAPPER}} .mf-input-wrapper .asRange .asRange-pointer:hover:before' => 'background-color: {{VALUE}};',

						'{{WRAPPER}} .mf-checkbox-option:hover input[type="checkbox"] + span, {{WRAPPER}} .mf-checkbox-option:hover input[type="checkbox"] + span:before, {{WRAPPER}} .mf-radio-option:hover input[type="radio"] + span, {{WRAPPER}} .mf-radio-option:hover input[type="radio"] + span:before' => 'color: {{VALUE}};',
					],
					'default' => '#000000',
				]
			);

			$this->add_group_control(
				Group_Control_Background::get_type(),
				[
					'name' => 'mf_field_input_background_hover',
					'label' => esc_html__( 'Background', 'metform-pro' ),
					'types' => [ 'classic', 'gradient' ],
					'selector' => '{{WRAPPER}} .mf-repeater-field:hover, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single:hover, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option:hover, {{WRAPPER}} span.select2-dropdown:hover, {{WRAPPER}} span.select2-dropdown input:hover, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--multiple .select2-selection__choice:hover, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--multiple .select2-selection__choice:hover .select2-selection__choice__remove, {{WRAPPER}} .mf-file-upload-container:hover .mf-input-file-upload-label',
				]
			);


			$this->add_group_control(
				Group_Control_Border::get_type(),
				[
					'name' => 'mf_field_input_border_hover',
					'label' => esc_html__( 'Border', 'metform-pro' ),
					'selector' => '{{WRAPPER}} .mf-repeater-field:hover, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single:hover, {{WRAPPER}} .select2-container--default .select2-search--dropdown .select2-search__field:hover, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option:hover, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered:hover, {{WRAPPER}} .mf-file-upload-container:hover .mf-input-file-upload-label',
				]
			);




			$this->end_controls_tab();

			$this->start_controls_tab(
				'mf_field_input_tabfocus',
				[
					'label' =>esc_html__( 'Focus', 'metform-pro' ),
				]
			);

			$this->add_control(
				'mf_field_input_color_focus',
				[
					'label' => esc_html__( 'Input Color', 'metform-pro' ),
					'type' => Controls_Manager::COLOR,
					'global' => [
						'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
					],
					'selectors' => [
						'{{WRAPPER}} .mf-repeater-field:focus' => 'color: {{VALUE}}',
						'{{WRAPPER}} .irs--round .irs-handle:focus'	=> 'border-color: {{VALUE}}',

						'{{WRAPPER}} .select2-container--default .select2-selection--single .select2-selection__rendered:focus,{{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option:focus, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-dropdown:focus, {{WRAPPER}} .mf-input-wrapper .select2-container--default ul.select2-results__options .select2-results__option[aria-selected=true]:focus, {{WRAPPER}} span.select2-dropdown input:focus, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--multiple .select2-selection__choice:focus, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--multiple .select2-selection__choice:focus .select2-selection__choice__remove, {{WRAPPER}} .mf-file-upload-container:focus .mf-input-file-upload-label, {{WRAPPER}} .mf-file-upload-container:focus .mf-image-label'	=> 'color: {{VALUE}};',

						'{{WRAPPER}} .mf-file-upload-container:focus .mf-input-file-upload-label svg path'	=> 'stroke: {{VALUE}}; fill: {{VALUE}};',

						'{{WRAPPER}} .mf-input-wrapper .asRange .asRange-pointer:focus:before' => 'background-color: {{VALUE}}'
					],
					'default' => '#000000',
				]
			);

			$this->add_group_control(
				Group_Control_Background::get_type(),
				[
					'name' => 'mf_field_input_background_focus',
					'label' => esc_html__( 'Background', 'metform-pro' ),
					'types' => [ 'classic', 'gradient' ],
					'selector' => '{{WRAPPER}} .mf-repeater-field:focus,  {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single:focus, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option:focus, {{WRAPPER}} span.select2-dropdown:focus, {{WRAPPER}} span.select2-dropdown input:focus, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--multiple .select2-selection__choice:focus, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--multiple .select2-selection__choice:focus .select2-selection__choice__remove, {{WRAPPER}} .mf-file-upload-container:focus .mf-input-file-upload-label',
				]
			);


			$this->add_group_control(
				Group_Control_Border::get_type(),
				[
					'name' => 'mf_field_input_border_focus',
					'label' => esc_html__( 'Border', 'metform-pro' ),
					'selector' => '{{WRAPPER}} .mf-repeater-field:focus, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single:focus, {{WRAPPER}} .select2-container--default .select2-search--dropdown .select2-search__field:focus, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option:focus, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered:focus, {{WRAPPER}} .mf-file-upload-container:focus .mf-input-file-upload-label',
				]
			);


			$this->end_controls_tab();

			$this->end_controls_tabs();

			$this->add_group_control(
				Group_Control_Typography::get_type(),
				[
					'name' => 'mf_field_input_typgraphy',
					'label' => esc_html__( 'Typography', 'metform-pro' ),
					'global' => [
						'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
					],
					'selector' => '{{WRAPPER}} .mf-repeater-field, {{WRAPPER}} .irs--round .irs-single, {{WRAPPER}} .select2-container--default .select2-selection--single .select2-selection__rendered,{{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-dropdown, {{WRAPPER}} .mf-input-wrapper .select2-container--default ul.select2-results__options .select2-results__option[aria-selected=true], {{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered, {{WRAPPER}} .asRange .asRange-pointer .asRange-tip, {{WRAPPER}} .mf-file-upload-container .mf-input-file-upload-label, {{WRAPPER}} .mf-checkbox-option:focus input[type="checkbox"] + span, {{WRAPPER}} .mf-checkbox-option:focus input[type="checkbox"] + span:before, {{WRAPPER}} .mf-radio-option:focus input[type="radio"] + span, {{WRAPPER}} .mf-radio-option:focus input[type="radio"] + span:before'
				]
			);



		$this->add_responsive_control(
			'mf_field_input_border_radius',
			[
				'label' => esc_html__( 'Border Radius', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => ['px','%'],
				'range' => [
					'px' => [
						'min' => 0,
						'max' => 100,
						'step' => 1,
					],
					'%' => [
						'min' => 0,
						'max' => 100,
					]
				],
				'default' => [
					'unit' => 'px',
					'size' => 0,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-repeater-field' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					'{{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single, {{WRAPPER}} .select2-container--default .select2-search--dropdown .select2-search__field, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered, {{WRAPPER}} .mf-file-upload-container .mf-input-file-upload-label'  => 'border-radius: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name' => 'mf_field_input_box_shadow',
				'label' => esc_html__( 'Box Shadow', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-repeater-field, {{WRAPPER}} .irs--round .irs-line, {{WRAPPER}} .select2-container, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-dropdown, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered, {{WRAPPER}} .mf-input-switch label.mf-input-control-label:before, {{WRAPPER}} .mf-input-wrapper .asRange, {{WRAPPER}} .asRange .asRange-pointer:before, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single, {{WRAPPER}} .mf-file-upload-container .mf-input-file-upload-label',
			]
		);

		$this->end_controls_section();


		$this->start_controls_section(
			'mf_input_help_text_section',
			[
				'label' => esc_html__( 'Help Text', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'mf_input_help_text!' => ''
				]
			]
        );

        $this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_input_help_text_typography',
				'label' => esc_html__( 'Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-input-help',
			]
		);

		$this->add_control(
			'mf_input_help_text_color',
			[
				'label' => esc_html__( 'Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-input-help' => 'color: {{VALUE}}',
				],
				'default' => '#939393',
			]
		);

		$this->add_responsive_control(
			'mf_input_help_text_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-input-help' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->end_controls_section();


		$this->start_controls_section(
			'mf_repeater_btn_section_style',
			[
				'label' =>esc_html__( 'Button', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);
		

        $this->add_group_control(
        	Group_Control_Text_Shadow::get_type(),
        	[
        		'name' => 'mf_repeater_btn_shadow',
        		'selector' => '{{WRAPPER}} .remove-btn',
        	]
		);

		$this->add_responsive_control(
            'mf_repeater_delete_button_heading',
            [
                'label' => esc_html__( 'Delete Button:', 'metform-pro' ),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_repeater_delete_btn_typography',
				'label' =>esc_html__( 'Typography', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .remove-btn, {{WRAPPER}} .repeater-delete-btn',
			]
		);

		$this->add_responsive_control(
            'mf_repeater_btn_icon_size',
            [
                'label' => esc_html__( 'Icon Size', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 6,
                        'max' => 300,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .remove-btn i' => 'font-size: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .remove-btn svg'  => 'max-width: {{SIZE}}{{UNIT}};',
				],
				'condition'	=> [
					'mf_input_repeater_btn_icon_status'	=> 'yes'
				]
            ]
		);

		$this->add_responsive_control(
            'mf_repeater_btn_icon_spacing',
            [
                'label' => esc_html__( 'Icon Spacing', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%'],
                'default' => [
                    'size' => 7,
                    'unit' => 'px',
                ],
                'range' => [
                    '%' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .remove-btn i, {{WRAPPER}} .remove-btn svg' => 'margin-right: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'mf_input_repeater_btn_icon_status' => 'yes',
                ],
            ]
		);

		$this->add_responsive_control(
			'mf_repeater_btn_text_padding',
			[
				'label' =>esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', 'em', '%' ],
				'selectors' => [
					'{{WRAPPER}} .remove-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_responsive_control(
			'mf_repeater_btn_text_margin',
			[
				'label' =>esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', 'em', '%' ],
				'selectors' => [
					'{{WRAPPER}} .remove-btn' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->start_controls_tabs( 'mf_repeater_btn_tabs_style' );

		$this->start_controls_tab(
			'mf_repeater_btn_tabnormal',
			[
				'label' =>esc_html__( 'Normal', 'metform-pro' ),
			]
		);

		$this->add_responsive_control(
			'mf_repeater_btn_text_color',
			[
				'label' =>esc_html__( 'Text Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'default' => '#fd397a',
				'selectors' => [
					'{{WRAPPER}} .remove-btn' => 'color: {{VALUE}};',
					'{{WRAPPER}} .remove-btn  svg path' => 'stroke: {{VALUE}}; fill: {{VALUE}};',
				],
			]
		);

        $this->add_group_control(
            Group_Control_Background::get_type(),
            array(
				'name'     => 'mf_repeater_btn_bg_color',
				'default' => 'rgba(253,57,122,.1)',
				'selector' => '{{WRAPPER}} .remove-btn',
            )
        );

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_repeater_remove_btn_border',
				'label' => esc_html__( 'Border', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .remove-btn, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single, {{WRAPPER}} .select2-container--default .select2-search--dropdown .select2-search__field, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered, {{WRAPPER}} .select2-container--default .select2-results>.select2-results__options, {{WRAPPER}} .mf-input-file-upload-label',
			]
		);

		$this->end_controls_tab();

		$this->start_controls_tab(
			'mf_repeater_btn_tab_button_hover',
			[
				'label' =>esc_html__( 'Hover', 'metform-pro' ),
			]
		);

		$this->add_responsive_control(
			'mf_repeater_btn_hover_color',
			[
				'label' =>esc_html__( 'Text Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'default' => '#ffffff',
				'selectors' => [
					'{{WRAPPER}} .remove-btn:hover' => 'color: {{VALUE}};',
					'{{WRAPPER}} .remove-btn:hover svg path' => 'stroke: {{VALUE}}; fill: {{VALUE}};',
				],
			]
		);

	    $this->add_group_control(
		    Group_Control_Background::get_type(),
		    array(
			    'name'     => 'mf_repeater_btn_bg_hover_color',
			    'default' => '#FD397A',
			    'selector' => '{{WRAPPER}} .remove-btn:hover',
		    )
	    );

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_repeater_remove_btn_hover_btn_border',
				'label' => esc_html__( 'Border', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .remove-btn:hover, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single, {{WRAPPER}} .select2-container--default .select2-search--dropdown .select2-search__field, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered, {{WRAPPER}} .select2-container--default .select2-results>.select2-results__options, {{WRAPPER}} .mf-input-file-upload-label',
			]
		);

		$this->end_controls_tab();
		$this->end_controls_tabs();


		$this->add_responsive_control(
            'mf_repeater_add_new_button_heading',
            [
                'label' => esc_html__( 'Add New Button:', 'metform-pro' ),
                'type' => Controls_Manager::HEADING,
                'separator' => 'before',
            ]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_repeater_add_new_btn_typography',
				'label' =>esc_html__( 'Typography', 'metform-pro' ),
				'selector' => ' {{WRAPPER}} .repeater-add-btn',
			]
		);

		$this->add_responsive_control(
            'mf_repeater_addnew_btn_icon_size',
            [
                'label' => esc_html__( 'Icon Size', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
                    'px' => [
                        'min' => 6,
                        'max' => 300,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .repeater-add-btn i' => 'font-size: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .repeater-add-btn svg'  => 'max-width: {{SIZE}}{{UNIT}};',
				],
				'condition'	=> [
					'mf_input_repeater_btn_icon_status'	=> 'yes'
				]
            ]
		);

		$this->add_responsive_control(
            'mf_repeater_addnew_btn_icon_spacing',
            [
                'label' => esc_html__( 'Icon Spacing', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'size_units' => ['px', '%'],
                'default' => [
                    'size' => 7,
                    'unit' => 'px',
                ],
                'range' => [
                    '%' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .repeater-add-btn i, {{WRAPPER}} .repeater-add-btn svg' => 'margin-right: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'mf_input_repeater_btn_icon_status' => 'yes',
                ],
            ]
		);

		$this->add_responsive_control(
			'mf_repeater_addnew_btn_text_padding',
			[
				'label' =>esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', 'em', '%' ],
				'selectors' => [
					'{{WRAPPER}} .repeater-add-btn' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_responsive_control(
			'mf_repeater_addnew_btn_text_margin',
			[
				'label' =>esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', 'em', '%' ],
				'selectors' => [
					'{{WRAPPER}} .repeater-add-btn' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->start_controls_tabs( 'mf_repeater_add_new_btn_tabs_style' );

		$this->start_controls_tab(
			'mf_repeater_addnew_btn_tabnormal',
			[
				'label' =>esc_html__( 'Normal', 'metform-pro' ),
			]
		);


		$this->add_responsive_control(
			'mf_repeater_addnew_btn_text_color',
			[
				'label' =>esc_html__( 'Text Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'default' => '#716aca',
				'selectors' => [
					'{{WRAPPER}} .repeater-add-btn' => 'color: {{VALUE}};',
					'{{WRAPPER}} .repeater-add-btn svg path' => 'stroke: {{VALUE}}; fill: {{VALUE}};',
				],
			]
		);

        $this->add_group_control(
            Group_Control_Background::get_type(),
            array(
				'name'     => 'mf_repeater_addnew_btn_bg_color',
				'default' => '',
				'selector' => '{{WRAPPER}} .repeater-add-btn',
            )
        );

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_repeater_add_btn_border',
				'label' => esc_html__( 'Border', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .repeater-add-btn, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single, {{WRAPPER}} .select2-container--default .select2-search--dropdown .select2-search__field, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered, {{WRAPPER}} .select2-container--default .select2-results>.select2-results__options, {{WRAPPER}} .mf-input-file-upload-label',
			]
		);

		$this->end_controls_tab();

		$this->start_controls_tab(
			'mf_repeater_addnew_btn_tab_button_hover',
			[
				'label' =>esc_html__( 'Hover', 'metform-pro' ),
			]
		);

		$this->add_responsive_control(
			'mf_repeater_addnew_btn_hover_color',
			[
				'label' =>esc_html__( 'Text Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'default' => '#ffffff',
				'selectors' => [
					'{{WRAPPER}} .repeater-add-btn:hover' => 'color: {{VALUE}};',
					'{{WRAPPER}} .repeater-add-btn:hover svg path' => 'stroke: {{VALUE}}; fill: {{VALUE}};',
				],
			]
		);

	    $this->add_group_control(
		    Group_Control_Background::get_type(),
		    array(
			    'name'     => 'mf_repeater_addnew_btn_bg_hover_color',
			    'default' => '',
			    'selector' => '{{WRAPPER}} .repeater-add-btn:hover',
		    )
	    );

		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_repeater_add_hover_btn_border',
				'label' => esc_html__( 'Border', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .repeater-add-btn:hover, {{WRAPPER}} .mf-input-wrapper .select2-container--default .select2-selection--single, {{WRAPPER}} .select2-container--default .select2-search--dropdown .select2-search__field, {{WRAPPER}} .mf-input-wrapper ul.select2-results__options .select2-results__option, {{WRAPPER}} .mf-input-wrapper .select2-container .select2-selection--multiple .select2-selection__rendered, {{WRAPPER}} .select2-container--default .select2-results>.select2-results__options, {{WRAPPER}} .mf-input-file-upload-label',
			]
		);

		$this->end_controls_tab();
		$this->end_controls_tabs();

		$this->end_controls_section();
	}

	public function render_common_input($repeater){
		$mf_input_label = isset($repeater['mf_input_repeater_label']) ? $repeater['mf_input_repeater_label'] : '';
		$mf_input_placeholder = isset($repeater['mf_input_repeater_placeholder']) ? $repeater['mf_input_repeater_placeholder'] : '';
		?>
		<div class="attr-form-group">
			<label class="attr-control-label mf-repeater-field-label">
				<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $this->render_on_editor() ); ?>
			</label>
			<input type="<?php echo esc_attr($repeater['mf_input_repeater_type']); ?>"
					class="mf-input attr-form-control mf-repeater-field mf-repeater-type-simple"
					placeholder="<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_placeholder), $this->render_on_editor() ); ?>"
					data-name="<?php echo esc_attr(isset($repeater['mf_input_repeater_name']) ? $repeater['mf_input_repeater_name'] : ''); ?>"
					<?php echo esc_attr($repeater['mf_input_repeater_type']) == "number"? 'step="any" min="0"':'' ?>
				/>
		</div>
		<?php
	}

	public function render_textarea_input($repeater){
		$mf_input_label = isset($repeater['mf_input_repeater_label']) ? $repeater['mf_input_repeater_label'] : '';
		$mf_input_placeholder = isset($repeater['mf_input_repeater_placeholder']) ? $repeater['mf_input_repeater_placeholder'] : '';
		?>
		<div class="attr-form-group">
			<label class="attr-control-label mf-repeater-field-label">
				<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $this->render_on_editor() ); ?>
			</label>
			<textarea
					class="mf-input attr-form-control mf-repeater-field mf-repeater-type-simple mf-repeater-textarea"
					placeholder="<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_placeholder), $this->render_on_editor() ); ?>"
					data-name="<?php echo esc_attr(isset($repeater['mf_input_repeater_name']) ? $repeater['mf_input_repeater_name'] : ''); ?>"
					rows="1"
					>
			</textarea>
		</div>
		<?php
	}

	public function render_radio_checkbox_input($repeater){
		$mf_input_label = isset($repeater['mf_input_repeater_label']) ? $repeater['mf_input_repeater_label'] : '';
		?>
		<div class="attr-form-group">
			<label class="mf-<?php echo esc_attr($repeater['mf_input_repeater_type']); ?>-label mf-repeater-field-label">
				<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $this->render_on_editor() ); ?>
			</label>
			<div class="mf-<?php echo esc_attr($repeater['mf_input_repeater_type']); ?>">
			<?php
			$mf_input_list = explode("\n", $repeater['mf_input_repeater_option']);
			foreach($mf_input_list as $option){
				$option = explode("|", $option);
				$option_text = isset($option[0]) ? $option[0] : '';
				?>
				<div class="mf-<?php echo esc_attr($repeater['mf_input_repeater_type']); ?>-option attr-<?php echo esc_attr($repeater['mf_input_repeater_type']); ?>-inline">
					<label>
						<input type="<?php echo esc_attr($repeater['mf_input_repeater_type']); ?>" class="mf-input mf-<?php echo esc_attr($repeater['mf_input_repeater_type']); ?>-input mf-repeater-checkbox  mf-repeater-type-simple"
						data-name="<?php echo esc_attr(isset($repeater['mf_input_repeater_name']) ? $repeater['mf_input_repeater_name'] : ''); ?><?php echo esc_attr(($repeater['mf_input_repeater_type'] == 'checkbox') ? '[]' : '');?>"
						data-value="<?php echo esc_attr( isset($option[1]) ? $option[1] : $option[0] ); ?>"
						/>
						<span><?php echo \MetForm\Utils\Util::react_entity_support( esc_attr($option_text), $this->render_on_editor() ); ?></span>
					</label>
				</div>
				<?php
			}
			?>
			</div>
		</div>
		<?php
	}

	public function render_select_input($repeater){
		$mf_input_label = isset($repeater['mf_input_repeater_label']) ? $repeater['mf_input_repeater_label'] : '';
		?>
		<div class="attr-form-group">
			<label class="mf-select-label mf-repeater-field-label">
				<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $this->render_on_editor() ); ?>
			</label>

			<select class="mf-input mf-input-select mf-repeater-select-field mf-repeater-field mf-repeater-type-simple"
				data-name="<?php echo esc_attr(isset($repeater['mf_input_repeater_name']) ? $repeater['mf_input_repeater_name'] : ''); ?>"
			>
			<?php
			$mf_input_list = explode("\n", $repeater['mf_input_repeater_option']); ?>
			<option></option>
			<?php
			foreach($mf_input_list as $option){
				$option = explode("|", $option);
				$option_text = isset($option[0]) ? $option[0] : '';
				?>
				<option value="<?php echo esc_attr( isset($option[1]) ? $option[1] : $option[0] ); ?>">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_attr($option_text), $this->render_on_editor() ); ?>
				</option>
				<?php
			}
			?>
			</select>
		</div>
		<?php
	}

	public function render_switch_input($repeater){
		$mf_input_label = isset($repeater['mf_input_repeater_label']) ? $repeater['mf_input_repeater_label'] : '';
		?>
		<div class="attr-form-group">
			<label class="mf-repeater-field-label">
				<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $this->render_on_editor() ); ?>
			</label>
			<span class="mf-input-switch-control mf-input-switch mf-input">
				<input type="checkbox"
					data-name="<?php echo esc_attr(isset($repeater['mf_input_repeater_name']) ? $repeater['mf_input_repeater_name'] : ''); ?>"
					value="1" class="mf-input mf-input-control mf-repeater-field mf-repeater-type-simple" id="mf-repeater-input-switch-<?php echo esc_attr($this->get_id()); ?>"
				/>
				<label data-enable="Yes" data-disable="No" class="mf-input-control-label" for="mf-repeater-input-switch-<?php echo esc_attr($this->get_id()); ?>"></label>
			</span>
		</div>
		<?php
	}

	public function render_range_input($repeater){
		$mf_input_label = isset($repeater['mf_input_repeater_label']) ? $repeater['mf_input_repeater_label'] : '';
		?>
		<div class="attr-form-group">
			<label class="mf-repeater-field-label">
				<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $this->render_on_editor() ); ?>
			</label>

			<div class="range-slider">
				<input type="range" class="mf-input mf-repater-range-input rs-range mf-repeater-type-simple"
					data-name="<?php echo esc_attr(isset($repeater['mf_input_repeater_name']) ? $repeater['mf_input_repeater_name'] : ''); ?>"
					data-value="<?php echo esc_attr(isset($repeater['mf_input_repeater_range_min']) ? $repeater['mf_input_repeater_range_min'] : ''); ?>"
					min="<?php echo esc_attr(isset($repeater['mf_input_repeater_range_min']) ? $repeater['mf_input_repeater_range_min'] : ''); ?>"
					max="<?php echo esc_attr(isset($repeater['mf_input_repeater_range_max']) ? $repeater['mf_input_repeater_range_max'] : ''); ?>"
					step="<?php echo esc_attr(isset($repeater['mf_input_repeater_range_step']) ? $repeater['mf_input_repeater_range_step'] : ''); ?>"
				/>
			</div>
		</div>
		<?php
	}

	public function render_on_editor() {
		return false;
	}

    protected function render($instance = []){
		$settings = $this->get_settings_for_display();
        extract($settings);

		$is_edit_mode = 'metform-form' === get_post_type() && \Elementor\Plugin::$instance->editor->is_edit_mode();

		$class = (isset($settings['mf_conditional_logic_form_list']) ? 'mf-conditional-input' : '') . ' ' . ( ($mf_input_repeater_btn_icon_status === 'yes') ? 'mf-input-btn-' . esc_attr($mf_input_repeater_btn_icon_status) : '' );
        ?>

		<div class="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label class="mf-input-repeater-label mf-input-label">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $this->render_on_editor() ); ?>
				</label>
			<?php endif; ?>

			<div class="mf-input-repeater <?php echo $class; ?>">

				<div class="mf-input-repeater-items attr-items" data-group="<?php echo esc_attr($mf_input_name); ?>">
					<div class="attr-pull-right mf-repeater-remove-btn">
						<a class="attr-btn attr-btn-danger remove-btn">
							<?php
								if ( $mf_input_repeater_btn_icon_status == 'yes' ) {
									Icons_Manager::render_icon( $mf_input_repeater_remove_btn_icon, [ 'aria-hidden' => 'true' ] );
								}

								echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_repeater_remove_btn_txt), $this->render_on_editor() );
							?>
						</a>
					</div>
					<div class="attr-item-content mf-input-repeater-content <?php echo 'mf-repeater-layout-' . esc_attr($mf_input_label_display_layout); ?>">
					<?php
					foreach($mf_input_repeater as $repeater){
						if( !in_array( $repeater['mf_input_repeater_type'], ['checkbox', 'radio', 'select', 'switch', 'range', 'textarea'] ) ) {

							$this->render_common_input($repeater);

						}elseif( in_array( $repeater['mf_input_repeater_type'], ['checkbox', 'radio'] ) ){

							$this->render_radio_checkbox_input($repeater);

						}elseif( $repeater['mf_input_repeater_type'] == 'select' ){

							$this->render_select_input($repeater);

						}elseif( $repeater['mf_input_repeater_type'] == 'switch' ){

							$this->render_switch_input($repeater);

						}elseif( $repeater['mf_input_repeater_type'] == 'range' ){

							$this->render_range_input($repeater);

						}elseif( $repeater['mf_input_repeater_type'] == 'textarea' ){

							$this->render_textarea_input($repeater);

						}
					}
					?>
					</div>
				</div>

			</div>

			<div class="attr-repeater-heading">
				<a class="attr-btn attr-btn-primary attr-pt-5 repeater-add-btn " >
					<?php
						if ( $mf_input_repeater_btn_icon_status == 'yes' ) {
							Icons_Manager::render_icon( $mf_input_repeater_add_btn_icon, [ 'aria-hidden' => 'true' ] );
						}

						echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_repeater_add_btn_txt), $this->render_on_editor() );
					?>
				</a>
			</div>

			<?php echo '' != $mf_input_help_text ? '<span class="mf-input-help">'. \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_help_text), $this->render_on_editor() ) .'</span>' : ''; ?>
		</div>

		<?php
    }
}
