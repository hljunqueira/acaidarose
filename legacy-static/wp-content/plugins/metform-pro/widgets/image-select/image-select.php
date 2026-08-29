<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Input_Image_Select extends Widget_Base{

	use \MetForm\Traits\Common_Controls;
	use \MetForm\Traits\Conditional_Controls;
	use \MetForm_Pro\Traits\Quiz_Control;

    public function get_name() {
		return 'mf-image-select';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_image_selector';
	}

	public function get_title() {
		return esc_html__( 'Image select', 'metform-pro' );
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
        return ['metform-pro', 'input', 'image', 'choose image', 'select image'];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list/#image-select';
    }

    protected function register_controls() {

		$this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'Content', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);
		
		if ( $this->get_form_type() == 'quiz-form' && class_exists('\MetForm_Pro\Base\Package') ) {

			$this->quiz_controls(['image-select']);

		} else {

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
						'{{WRAPPER}} .mf-input-label' => 'display: {{VALUE}}; vertical-align: top',
						'{{WRAPPER}} .mf-image-select' => 'display: inline-block',
					],
					'condition'    => [
						'mf_input_label_status' => 'yes',
					],
					'description' => esc_html__('Select label position. where you want to see it. top of the input or left of the input.', 'metform-pro'),
	
				]
			);
	
			$this->add_control(
				'mf_input_label',
				[
					'label' => esc_html__( 'Input Label : ', 'metform-pro' ),
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
					'frontend_available'	=> true
				]
			);
	
			$this->add_control(
				'mf_input_display_option',
				[
					'label' => esc_html__( 'Option Display : ', 'metform-pro' ),
					'type' => Controls_Manager::SELECT,
					'default' => 'solid',
					'options' => [
						'inline-flex'  => esc_html__( 'Horizontal', 'metform-pro' ),
						'inline-block' => esc_html__( 'Vertical', 'metform-pro' ),
					],
					'default' => 'inline-flex',
					'selectors' => [
						'{{WRAPPER}} .mf-image-select' => 'display: {{VALUE}};',
					],
					'description' => esc_html__('Image select option display style.', 'metform-pro'),
				]
			);
	
			$this->add_control(
				'mf_input_options_multiselect',
				[
					'label' => esc_html__( 'Select Type : ', 'metform-pro' ),
					'type' => Controls_Manager::SELECT,
					'options' => [
						'radio'		=> esc_html__( 'Single Select', 'metform-pro' ),
						'checkbox'	=> esc_html__( 'Multi Select', 'metform-pro' ),
					],
					'default' => 'radio',
					// 'description' => esc_html__('Image select option display style.', 'metform-pro'),
				]
			);
	
			$input_fields = new Repeater();
	
			$input_fields->add_control(
				'mf_image_select_title',
				[
					'label' => esc_html__( 'Title', 'metform-pro' ),
					'type' => Controls_Manager::TEXT,
				]
			);
	
			$input_fields->add_control(
				'mf_input_option_text',
				[
					'label' => esc_html__( 'Thumbnail', 'metform-pro' ),
					'type' => Controls_Manager::MEDIA,
					'default' => [
						'url' => Utils::get_placeholder_image_src(),
					],
				]
			);
	
			$input_fields->add_control(
				'mf_input_option_img_hover',
				[
					'label' => esc_html__( 'Preview (Optional)', 'metform-pro' ),
					'type' => Controls_Manager::MEDIA,
					'default' => [
						'url' => Utils::get_placeholder_image_src(),
					],
				]
			);
	
			$input_fields->add_control(
				'mf_input_option_value', [
					'label' => esc_html__( 'Option Value', 'metform-pro' ),
					'type' => Controls_Manager::TEXT,
					'default' => esc_html__( 'Option Value' , 'metform-pro' ),
					'label_block' => true,
					'description' => esc_html__('Select option value that will be store/mail to desired person.', 'metform-pro'),
				]
			);
			$input_fields->add_control(
				'mf_input_option_status', [
					'label' => esc_html__( 'Option Status', 'metform-pro' ),
					'type' => Controls_Manager::SELECT,
					'options' => [
						''  => esc_html__( 'Active', 'metform-pro' ),
						'disabled' => esc_html__( 'Disable', 'metform-pro' ),
					],
					'default' => '',
					'label_block' => true,
					'description' => esc_html__('Want to make a option? which user can see the option but can\'t select it. make it disable.', 'metform-pro'),
				]
			);
	
			$input_fields->add_control(
				'mf_input_option_default_value', [
						'label' => esc_html__( 'Select it default ?', 'metform-pro' ),
						'type' => Controls_Manager::SWITCHER,
						'yes' => esc_html__( 'Yes', 'metform-pro' ),
						'no' => esc_html__( 'No', 'metform-pro' ),
						'return_value' => 'yes',
						'default' => 'no',
					]
			);
	
			$this->add_control(
				'mf_input_list',
				[
					'label' => esc_html__( 'Image select Options', 'metform-pro' ),
					'type' => Controls_Manager::REPEATER,
					'fields' => $input_fields->get_controls(),
					'default' => [
						[
							'mf_input_option_value' => 'image-1',
							'mf_input_option_status' => '',
						],
						[
							'mf_input_option_value' => 'image-2',
							'mf_input_option_status' => '',
						],
						[
							'mf_input_option_value' => 'image-3',
							'mf_input_option_status' => '',
						],
					],
					'title_field' => '{{{ mf_image_select_title }}}',
					'description' => esc_html__('You can add/edit here your selector options.', 'metform-pro'),
					'frontend_available' => true,
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
		}

        $this->end_controls_section();

        $this->start_controls_section(
			'settings_section',
			[
				'label' => esc_html__( 'Settings', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->input_setting_controls();

		$this->add_control(
			'mf_input_validation_type',
			[
				'label' => __( 'Validation Type', 'metform-pro' ),
				'type' => \Elementor\Controls_Manager::HIDDEN,
				'default' => 'none',
			]
		);

		$this->input_get_params_controls();

		$this->end_controls_section();

		if(class_exists('\MetForm_Pro\Base\Package')){
			$this->input_conditional_control();
		}

		$this->start_controls_section(
			'mf_image_select_item',
			[
				'label'	=> esc_html__('Item', 'metform-pro'),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);

		$this->add_responsive_control(
			'mf_image_select_item_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-image-select-option' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);
		$this->add_responsive_control(
			'mf_image_select_item_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-image-select-option' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_responsive_control(
            'mf_image_select_item_border_radius',
            [
                'label' => esc_html__( 'Border Radius', 'metform-pro' ),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
                'selectors' => [
                    '{{WRAPPER}} .mf-image-select-option' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name' => 'mf_image_select_item_box_shadow',
				'label' => esc_html__( 'Box Shadow', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-image-select-option',
			]
		);


		$this->start_controls_tabs('mf_image_select_item_color_tabs');
			$this->start_controls_tab(
				'mf_image_select_item_normal_color_tab',
				[
					'label'	=> esc_html__('Normal', 'metform-pro')
				]
			);

			$this->add_group_control(
				Group_Control_Border::get_type(),
				[
					'name' => 'mf_image_select_item_border',
					'selector' => '{{WRAPPER}} .mf-image-select-option',
					'fields_options' => [
						'border' => [
							'label' =>  esc_html__( 'Border', 'metform-pro' ),
							'default' => 'solid',
						],
						'width' => [
							'default' => [
								'top' => '3',
								'right' => '3',
								'bottom' => '3',
								'left' => '3',
								'isLinked' => true,
							],
						]
					],
				]
			);

			$this->end_controls_tab();

			$this->start_controls_tab(
				'mf_image_select_item_selected_color_tab',
				[
					'label'	=> esc_html__('Selected', 'metform-pro')
				]
			);

			$this->add_group_control(
				Group_Control_Border::get_type(),
				[
					'name' => 'mf_image_select_item_border_active',
					'selector' => '{{WRAPPER}} .mf-image-select-option.active',
					'fields_options' => [
						'border' => [
							'label' =>  esc_html__( 'Border', 'metform-pro' ),
							'default' => 'solid',
						],
						'width' => [
							'default' => [
								'top' => '3',
								'right' => '3',
								'bottom' => '3',
								'left' => '3',
								'isLinked' => true,
							],
						],
						'color' => [
							'default' => '#333',
						],
					],
				]
			);


			$this->end_controls_tab();
		$this->end_controls_tabs();


		$this->end_controls_section(); // Item

        if ( $this->get_form_type() == 'quiz-form' && class_exists('\MetForm_Pro\Base\Package') ) {
			$this->start_controls_section(
				'label_section',
				[
					'label' => esc_html__( 'Question', 'metform-pro' ),
					'tab' => Controls_Manager::TAB_STYLE,
				]
			);

		} else {
			$this->start_controls_section(
				'label_section',
				[
					'label' => esc_html__( 'Input Label', 'metform-pro' ),
					'tab' => Controls_Manager::TAB_STYLE,
					'conditions' => [
						'relation' => 'or',
						'terms' => [
							[
								'name' => 'mf_input_label_status',
								'operator' => '===',
								'value' => 'yes',
							],
							[
								'name' => 'mf_input_required',
								'operator' => '===',
								'value' => 'yes',
							],
						],
					],
				]
			);
		}

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

		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name' => 'mf_input_label_box_shadow',
				'label' => esc_html__( 'Box Shadow', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-input-label',
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
					'{{WRAPPER}} .mf-input-required-indicator' => 'color: {{VALUE}}'
				],
				'condition'    => [
                    'mf_input_required' => 'yes',
                ],
			]
		);

		$this->add_control(
			'mf_input_warning_text_color',
			[
				'label' => esc_html__( 'Warning Text Color:', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'default' => '#f00',
				'selectors' => [
					'{{WRAPPER}} .mf-error-message' => 'color: {{VALUE}}'
				],
				'condition'    => [
                    'mf_input_required' => 'yes',
                ],
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_input_warning_text_typography',
				'label' => esc_html__( 'Warning Text Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-error-message',
				'condition'    => [
                    'mf_input_required' => 'yes',
                ],
			]
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'mf_image_select_title',
			[
				'label'	=> esc_html__('Title', 'metform-pro'),
				'tab' => Controls_Manager::TAB_STYLE,
			]
		);
		$this->add_control(
			'mf_image_select_title_position',
			[
				'label' => esc_html__( 'Position:', 'metform-pro' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'solid',
				'options' => [
					'column'  => esc_html__( 'Top', 'metform-pro' ),
					'column-reverse' => esc_html__( 'Bottom', 'metform-pro' ),
                ],
                'default' => 'column-reverse',
                'selectors' => [
                    '{{WRAPPER}} .mf-image-select-option' => 'flex-direction: {{VALUE}};',
				],
			]
        );

		$this->add_responsive_control(
			'mf_image_select_title_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-image-select-title' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);
		$this->add_responsive_control(
			'mf_image_select_title_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-image-select-title' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);
		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_image_select_title_border',
				'label' => esc_html__( 'Border', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-image-select-title',
			]
		);
		$this->add_responsive_control(
            'mf_image_select_title_border_radius',
            [
                'label' => esc_html__( 'Border Radius', 'metform-pro' ),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
                'selectors' => [
                    '{{WRAPPER}} .mf-image-select-title' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name' => 'mf_image_select_title_box_shadow',
				'label' => esc_html__( 'Box Shadow', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-image-select-title',
			]
		);

		$this->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_image_select_title_typo',
				'label' => esc_html__( 'Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-image-select-title',
			]
		);

		$this->start_controls_tabs('mf_image_select_title_color_tabs');
			$this->start_controls_tab(
				'mf_image_select_title_normal_color_tab',
				[
					'label'	=> esc_html__('Normal', 'metform-pro')
				]
			);

			$this->add_control(
				'mf_image_select_title_color',
				[
					'label' => esc_html__( 'Color', 'metform-pro' ),
					'type' => Controls_Manager::COLOR,
					'selectors' => [
						'{{WRAPPER}} .mf-image-select-title' => 'color: {{VALUE}}',
					],
					'default' => '#73788F',
				]
			);
			$this->add_group_control(
				Group_Control_Background::get_type(),
				array(
					'name'     => 'mf_image_select_title_bg_color',
					'default' => '#F7F8FA',
					'selector' => '{{WRAPPER}} .mf-image-select-title',
				)
			);

			$this->end_controls_tab();

			$this->start_controls_tab(
				'mf_image_select_title_selected_color_tab',
				[
					'label'	=> esc_html__('Selected', 'metform-pro')
				]
			);

			$this->add_control(
				'mf_image_select_title_color_selected',
				[
					'label' => esc_html__( 'Color', 'metform-pro' ),
					'type' => Controls_Manager::COLOR,
					'selectors' => [
						'{{WRAPPER}} .mf-image-select-option.active .mf-image-select-title' => 'color: {{VALUE}}',
					],
					'default' => '#fff',
				]
			);
			$this->add_group_control(
				Group_Control_Background::get_type(),
				array(
					'name'     => 'mf_image_select_title_bg_color_selected',
					'default' => '#73788F',
					'selector' => '{{WRAPPER}} .mf-image-select-option.active .mf-image-select-title',
				)
			);


			$this->end_controls_tab();
		$this->end_controls_tabs();


		$this->end_controls_section();

        $this->start_controls_section(
            'image_option_section',
            [
                'label' => esc_html__('Image', 'metform-pro'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_responsive_control(
			'mf_input_option_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-image-select-option input[type="radio"] + img' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					'{{WRAPPER}} .mf-image-select-option input[type="checkbox"] + img' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);
		$this->add_responsive_control(
			'mf_input_option_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-image-select-option input[type="radio"] + img' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					'{{WRAPPER}} .mf-image-select-option input[type="checkbox"] + img' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$this->add_responsive_control(
            'mf_input_option_border_radius',
            [
                'label' =>esc_html__( 'Border Radius', 'metform-pro' ),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px'],
                'default' => [
                    'top' => '',
                    'right' => '',
                    'bottom' => '' ,
                    'left' => '',
                ],
                'selectors' => [
                    '{{WRAPPER}} .mf-image-select-option input[type="radio"] + img' =>  'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                    '{{WRAPPER}} .mf-image-select-option input[type="checkbox"] + img' =>  'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );



		$this->add_responsive_control(
			'mf_input_option_space_between',
			[
				'label' => esc_html__( 'Width', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
					'px' => [
						'min' => 20,
						'max' => 1000,
						'step' => 1,
					],
				],
				'default' => [
                    'unit' => 'px',
                    'size' => 200,
                ],
				'selectors' => [
					'{{WRAPPER}} .mf-input-wrapper .mf-image-select-option .mf-input, {{WRAPPER}} .mf-image-select-option .mf-input[type="radio"] + img' => 'width: {{SIZE}}{{UNIT}}',
					'{{WRAPPER}} .mf-image-select-option .mf-input[type="checkbox"] + img' => 'width: {{SIZE}}{{UNIT}}',
				]
			]
		);

		$this->add_responsive_control(
			'mf_input_option_height',
			[
				'label' => esc_html__( 'Height', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
					'px' => [
						'min' => 20,
						'max' => 1000,
						'step' => 1,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .mf-input-wrapper .mf-image-select-option .mf-input, {{WRAPPER}} .mf-image-select-option .mf-input[type="radio"] + img' => 'height: {{SIZE}}{{UNIT}}',
					'{{WRAPPER}} .mf-image-select-option .mf-input[type="checkbox"] + img' => 'height: {{SIZE}}{{UNIT}}',
				]
			]
		);

		$this->add_control(
            'mf_select_img_preview_img_border_color',
            [
                'label' => esc_html__( 'Preview Border Color', 'metform-pro' ),
                'type' => Controls_Manager::COLOR,
                'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
				],
				'default' => '#333',
                'selectors' => [
					'{{WRAPPER}} .mf-select-hover-image' => 'border-color: {{VALUE}}',
					'{{WRAPPER}} .mf-select-hover-image:before' => 'border-bottom-color: {{VALUE}}',
					'{{WRAPPER}} .mf-select-hover-image:after' => 'border-top-color: {{VALUE}}',
                ],
            ]
        );

		$this->start_controls_tabs('mf_input_border_tabs');

		$this->start_controls_tab(
			'mf_input_border_normal_tab',
			[
				'label'	=> esc_html__('Normal', 'metform-pro')
			]
		);
			$this->add_group_control(
				Group_Control_Border::get_type(),
				[
					'name' => 'mf_input_option_normal_image',
					'selector' => '{{WRAPPER}} .mf-image-select-option input[type="radio"] + img, {{WRAPPER}} .mf-image-select-option input[type="checkbox"] + img',
				]
			);
		$this->end_controls_tab();

		$this->start_controls_tab(
			'mf_input_border_selected_tab',
			[
				'label'	=> esc_html__('Selected', 'metform-pro')
			]
		);

			$this->add_group_control(
				Group_Control_Border::get_type(),
				[
					'name' => 'mf_input_option_selected_image',
					'selector' => '{{WRAPPER}} .mf-image-select-option input[type="radio"]:checked + img, {{WRAPPER}} .mf-image-select-option input[type="checkbox"]:checked + img',
				]
			);

		$this->end_controls_tab();

		$this->end_controls_tabs();

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


	}

    protected function render($instance = []){
		$settings = $this->get_settings_for_display();
		$inputWrapStart = $inputWrapEnd = '';
        extract($settings);

		$render_on_editor = true;
		$is_edit_mode = 'metform-form' === get_post_type() && \Elementor\Plugin::$instance->editor->is_edit_mode();

		/**
		 * Loads the below markup on 'Editor' view, only when 'metform-form' post type
		 */
		if ( $is_edit_mode ):
			$inputWrapStart = '<div class="mf-form-wrapper"></div><script type="text" class="mf-template">return html`';
			$inputWrapEnd = '`</script>';
		endif;

		$class = (isset($settings['mf_conditional_logic_form_list']) ? 'mf-conditional-input' : '');

		$configData = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : esc_html__('This field is required.', 'metform-pro') : esc_html__('This field is required.', 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false
		];

		$mf_default_input_list = isset($mf_input_list) ? array_values(array_filter($mf_input_list, function($item){
			if(isset($item['mf_input_option_default_value']) && $item['mf_input_option_default_value'] === 'yes'){
			    return $item["mf_input_option_value"];
			}
			return false;
		 })) : array();

		 if($mf_input_options_multiselect === 'radio'){			
			$mf_default_input_list = array_slice($mf_default_input_list, -1, 1);
		}

        $default_value =  count($mf_default_input_list) > 0 ? array_column($mf_default_input_list, 'mf_input_option_value') : array();

	   if(!$is_edit_mode && isset($mf_quiz_point) && class_exists('\MetForm_Pro\Base\Package')){
		$answer_list = isset($mf_input_list) ? array_values(array_filter($mf_input_list, function($item){
			if(isset($item['mf_quiz_question_answer']) && !empty($item['mf_quiz_question_answer'])){
				return $item["mf_input_option_value"];
			}
			return false;
		})) : array();

		$answers = count($answer_list) > 0 ? array_column($answer_list, 'mf_input_option_value') : array();
		$answer = count($answers) > 0 ? $answers[count($answers) - 1] : "";
		$quizDataCheckbox = array("answer" => $answers, "correctPoint" => esc_attr($mf_quiz_point ?? 0), "incorrectPoint" => esc_attr($mf_quiz_negative_point ?? 0));
		$quizDataRadio = array("answer" => $answer, "correctPoint" => esc_attr($mf_quiz_point ?? 0), "incorrectPoint" => esc_attr($mf_quiz_negative_point ?? 0));

	   }
		?>

		<?php echo $inputWrapStart; ?>

		<div className="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label className="mf-input-label" htmlFor="mf-input-image-select-<?php echo esc_attr( $this->get_id() ); ?>">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span className="mf-input-required-indicator"><?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?></span>
				</label>
			<?php endif; ?>

			<div className="mf-image-select" id="mf-input-image-select-<?php echo esc_attr($this->get_id()); ?>">
				<?php
				foreach($mf_input_list as $option){
					?>
					<?php if ( $mf_input_options_multiselect === 'checkbox' ): ?>
  					<div className=${"mf-image-select-option <?php echo esc_attr($option['mf_input_option_status']); ?>" + (parent.getValue("<?php echo esc_attr($mf_input_name); ?>").includes("<?php echo esc_attr($option['mf_input_option_value']); ?>") ? "active" : "")}>
					<?php else : ?>
					<div className=${"mf-image-select-option <?php echo esc_attr($option['mf_input_option_status']); ?>" + (parent.getValue("<?php echo esc_attr($mf_input_name); ?>") == "<?php echo esc_attr($option['mf_input_option_value']); ?>" ? "active" : "")}>
					<?php endif; ?>
						<?php if(!empty($option['mf_image_select_title'])) : ?>
							<div className="mf-image-select-title"><?php echo \MetForm\Utils\Util::react_entity_support( esc_html( $option['mf_image_select_title'] ), $render_on_editor ); ?></div>
						<?php endif; ?>

						<div className="mf-image-select-thumbnail">
							<label>
								<input
									type="<?php echo esc_html( $mf_input_options_multiselect ); ?>"
									className="mf-input mf-image-select-input <?php echo $class; ?>"
									name="<?php echo esc_attr($mf_input_name); ?>"
									value="<?php echo esc_attr($option['mf_input_option_value']); ?>"
									<?php echo esc_attr($option['mf_input_option_status'] === 'disabled' ? 'disabled' : ''); ?>
									<?php if ( !$is_edit_mode ){ ?>
										<?php if ( $mf_input_options_multiselect === 'checkbox' ): ?>
										onInput=${(event)=>{
											parent.handleCheckbox(event.target, 'onClick')
										}}
										<?php else : ?>
										onInput=${parent.handleChange}
										<?php endif; ?>
										aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>'] ? 'true' : 'false'}
										ref=${(el) => {
											<?php if ( isset($quizDataCheckbox) && $mf_input_options_multiselect == 'checkbox' && ($quizDataCheckbox['correctPoint'] != 0 || $quizDataCheckbox['incorrectPoint'] != 0) ) { ?>
												!parent.state.answers["<?php echo esc_attr($mf_input_name); ?>"] && (
												parent.state.answers["<?php echo esc_attr($mf_input_name); ?>"] = <?php echo json_encode($quizDataCheckbox); ?>)
											<?php } elseif (isset($quizDataRadio) && $mf_input_options_multiselect == 'radio' && ($quizDataRadio['correctPoint'] != 0 || $quizDataRadio['incorrectPoint'] != 0) ) { ?>
												!parent.state.answers["<?php echo esc_attr($mf_input_name); ?>"] && (
												parent.state.answers["<?php echo esc_attr($mf_input_name); ?>"] = <?php echo json_encode($quizDataRadio); ?>)
											<?php } ?>
											if(parent.state?.submitted !== true){
												if ( parent.getValue("<?php echo esc_attr($mf_input_name); ?>") === '' && <?php echo (count($mf_default_input_list) > 0) ? 'true' : 'false'; ?> ) {
												register({ name: "<?php echo esc_attr($mf_input_name); ?>" }, parent.activateValidation(<?php echo json_encode($configData); ?>));
												if ( "<?php echo $mf_input_options_multiselect ?>" ==='checkbox' ){
													<?php 
													if ( version_compare( \MetForm\Plugin::instance()->version(), '2.2.1', '>' ) ) {
														?>
														parent.setValue( '<?php echo esc_attr($mf_input_name); ?>', '<?php echo json_encode($default_value); ?>');
														parent.multiSelectChange('<?php echo json_encode($mf_default_input_list)?>', '<?php echo esc_attr($mf_input_name); ?>');
														<?php
													}
													?>
												} else {
													parent.setValue( '<?php echo esc_attr($mf_input_name); ?>', '<?php echo json_encode($default_value); ?>');
													parent.handleChange({
														target: {
															name: '<?php echo esc_attr($mf_input_name); ?>',
															value: '<?php echo (count($mf_default_input_list) > 0) ? esc_attr( $mf_default_input_list[0]["mf_input_option_value"] ) : ''; ?>'
														}
													});
												}
												}else{
													parent.activateValidation(<?php echo json_encode($configData); ?>, el);
												}
											}else{
												parent.activateValidation(<?php echo json_encode($configData); ?>, el);
											}
										}}
									<?php } ?>
									/>

								<img src="<?php echo esc_url($option['mf_input_option_text']['url']); ?>" alt="image-select" onMouseMove=${parent.handleImagePreview} onMouseLeave=${parent.handleImagePreview} />

								<?php if($option['mf_input_option_img_hover']['url']) : ?>
									<div className="mf-select-hover-image">
										<img src="<?php echo esc_url($option['mf_input_option_img_hover']['url']); ?>" alt="image-select" />
									</div>
								<?php endif; ?>
							</label>
						</div>
					</div>
					<?php
				}
				?>
			</div>

			<?php if ( !$is_edit_mode ) : ?>
				<${validation.ErrorMessage}
					errors=${validation.errors}
					name="<?php echo esc_attr( $mf_input_name ); ?>"
					as=${html`<span className="mf-error-message"></span>`}
					/>
			<?php endif; ?>

			<?php echo '' != $mf_input_help_text ? '<span className="mf-input-help">'. \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_help_text), $render_on_editor ) .'</span>' : ''; ?>
		</div>

		<?php echo $inputWrapEnd; ?>

		<?php
    }
}
