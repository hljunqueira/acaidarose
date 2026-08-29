<?php
namespace MetForm_Pro\Core\Integrations;
defined( 'ABSPATH' ) || exit;

Class Multistep_Form_Controls{
    public function __construct( ){
        add_action('elementor/element/metform/content_section/after_section_end', array( $this, 'register_controls' ), 5, 2);
    }

    public function register_controls($control, $args){

        /**
         * Start multistep controls
         */
        // multiform form on off
        $control->start_controls_section(
			'multistep_section',
			[
				'label' => esc_html__( 'Multistep Settings', 'metform-pro' ),
				'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
			]
        );

        $control->add_control(
            'mf_form_multistep_status',
            [
                'label' =>esc_html__( 'Enable Multistep?', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' =>esc_html__( 'Yes', 'metform-pro' ),
                'label_off' =>esc_html__( 'No', 'metform-pro' ),
                'return_value' => 'mf-multistep-container',
                'frontend_available' => true,
                'default' => 'no',
                'separator' => 'before',
            ]
        );

        $control->add_control(
            'mf_form_multistep_fixed_height',
            [
                'label' =>esc_html__( 'Adaptive Form Container Height?', 'metform-pro' ),
                'description'  => esc_html__('Enable this to make the multistep form height adapt to current step height. ( Disables Equal Height Step Container )', 'metform-pro'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' =>esc_html__( 'Yes', 'metform-pro' ),
                'label_off' =>esc_html__( 'No', 'metform-pro' ),
                'return_value' => '0',
                'default' => '',
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-form-content .elementor-top-section:not(.active), {{WRAPPER}} .mf-multistep-container .elementor-section-wrap > .e-con:not(.active)' => 'height: {{VALUE}};',
                ],
                'condition' => [
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'mf_form_multistep_display_nav',
            [
                'label' =>esc_html__( 'Display Multistep Nav?', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' =>esc_html__( 'Yes', 'metform-pro' ),
                'label_off' =>esc_html__( 'No', 'metform-pro' ),
                'return_value' => 'yes',
                'default' => 'yes',
                'condition' => [
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'mf_step_scroll_top',
            [
                'label' =>esc_html__( 'Enable scroll to top?', 'metform-pro' ),
                'description'  => esc_html__('Enable scroll to top animation for bigger form when click on the next/prev button', 'metform-pro'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'label_on' =>esc_html__( 'Yes', 'metform-pro' ),
                'label_off' =>esc_html__( 'No', 'metform-pro' ),
                'return_value' => 'yes',
                'default' => 'no',
                'condition' => [
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

	   //get curret version of Metform
	  $metform_version = \MetForm\Plugin::instance()->version();
	  if ( version_compare( $metform_version, "2.2.0", '>' ) ) {
		$control->add_control(
			'mf_form_previous_steps_style',
			[
			    'label' =>esc_html__( 'Multistep progress style?', 'metform-pro' ),
			    'description'  => esc_html__('Enable & customize how you want the progress of the form steps to be displayed', 'metform-pro'),
			    'type' => \Elementor\Controls_Manager::SWITCHER,
			    'label_on' =>esc_html__( 'Yes', 'metform-pro' ),
			    'label_off' =>esc_html__( 'No', 'metform-pro' ),
			    'return_value' => 'yes',
			    'default' => 'no',
			    'condition' => [
				   'mf_form_multistep_status' => 'mf-multistep-container',
				   'mf_form_multistep_display_nav' => 'yes',
			    ],
			]
		   );
	
		   $control->add_control(
			'mf_form_previous_steps_color',
			[
			    'label' => esc_html__( 'Color', 'metform-pro' ),
			    'type' => \Elementor\Controls_Manager::COLOR,
			    'global' => [
                    'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
                ],
			    'default' => '#fff',
			    'selectors' => [
				   '{{WRAPPER}} .mf-multistep-container .metform-steps li.progress' => 'color: {{VALUE}};',
				   '{{WRAPPER}} .mf-multistep-container .metform-steps li.progress:hover' => 'color: {{VALUE}};',
			    ],
			    'condition' => [
				   'mf_form_multistep_display_nav' => 'yes',
				   'mf_form_previous_steps_style' => 'yes',
				   'mf_form_multistep_status' => 'mf-multistep-container'
			    ],
			]
		  );
	
		 $control->add_control(
			'mf_form_previous_steps_background_color',
			[
			    'label' => esc_html__( 'Background Color', 'metform-pro' ),
			    'type' => \Elementor\Controls_Manager::COLOR,
			    'global' => [
                    'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
                ],
			    'default' => '#3970FF',
			    'selectors' => [
				   '{{WRAPPER}} .mf-multistep-container .metform-steps li.progress' => 'background-color: {{VALUE}}',
				   '{{WRAPPER}} .mf-multistep-container .metform-steps li.progress:hover' => 'background-color: {{VALUE}}',
			    ],
			    'condition' => [
				   'mf_form_multistep_display_nav' => 'yes',
				   'mf_form_previous_steps_style' => 'yes',
				   'mf_form_multistep_status' => 'mf-multistep-container'
			    ],
			]
		  );
	
		 $control->add_group_control(
			\Elementor\Group_Control_Border::get_type(),
			[
			    'name' => 'mf_form_previous_steps_border',
			    'selector' => '{{WRAPPER}} .mf-multistep-container .metform-steps li.progress, {{WRAPPER}} .mf-multistep-container .metform-steps li.progress:hover',
			    'condition' => [
				   'mf_form_multistep_display_nav' => 'yes',
				   'mf_form_previous_steps_style' => 'yes',
				   'mf_form_multistep_status' => 'mf-multistep-container'
			    ],
			]
		  );
	  }

        $control->add_responsive_control(
            'mf_form_multistep_alignment',
            [
                'label' => esc_html__( 'Alignment', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::CHOOSE,
                'options' => [
                    'flex-start' => [
                        'title' => esc_html__( 'Left', 'metform-pro' ),
                        'icon' => 'fa fa-align-left',
                    ],
                    'center' => [
                        'title' => esc_html__( 'Center', 'metform-pro' ),
                        'icon' => 'fa fa-align-center',
                    ],
                    'flex-end' => [
                        'title' => esc_html__( 'Right', 'metform-pro' ),
                        'icon' => 'fa fa-align-right',
                    ],
                ],
                'default' => 'center',
                'toggle' => true,
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-steps' => 'justify-content: {{VALUE}};',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'mf_form_multistep_slide_direction',
            [
                'label' => esc_html__( 'Slide Direction', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::HIDDEN,
                'default' => 'horizontal',
                'options' => [
                    'horizontal' => esc_html__( 'Horizontal', 'metform-pro' ),
                    'vertical'           => esc_html__( 'Vertical', 'metform-pro' ),
                ],

            ]
        );

        $control->add_group_control(
            \Elementor\Group_Control_Typography::get_type(),
            [
                'name' => 'mf_input_option_typo',
                'label' => esc_html__( 'Typography', 'metform-pro' ),
                'global' => [
                    'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
                ],
                'selector' => '{{WRAPPER}} .mf-multistep-container .metform-steps li',
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_responsive_control(
            'mf_input_option_padding',
            [
                'label' => esc_html__( 'Padding', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
                'default' => 	[
                    'top' => '13',
                    'right' => '35',
                    'bottom' => '13',
                    'left' => '35',
                    'unit' => 'px',
                ],
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-steps li' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_responsive_control(
            'mf_input_option_margin',
            [
                'label' => esc_html__( 'Margin', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
                'default' => 	[
                    'top' => '0',
                    'right' => '5',
                    'bottom' => '5',
                    'left' => '5',
                    'unit' => 'px',
                ],
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-steps li' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_responsive_control(
            'mf_input_option_margin_border_radius',
            [
                'label' => esc_html__( 'Border Radius', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-steps li' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'select_or_normal_or_hover_style',
            [
                'label' => esc_html__( 'Text:', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::HEADING,
                'separator' => 'before',
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->start_controls_tabs( 'mf_input_tabs_style' );

        $control->start_controls_tab(
            'mf_input_tabnormal',
            [
                'label' =>esc_html__( 'Normal', 'metform-pro' ),
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'mf_input_option_font_color_normal',
            [
                'label' => esc_html__( 'Color', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'global' => [
                    'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
                ],
                'default' => '#54565C',
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-steps li' => 'color: {{VALUE}}',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'mf_input_option_background_color_normal',
            [
                'label' => esc_html__( 'Background Color', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'global' => [
                    'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
                ],
                'default' => '#E7EAF2',
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-steps li' => 'background-color: {{VALUE}}',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'mf_input_option_border_style_normal',
                'selector' => '{{WRAPPER}} .mf-multistep-container .metform-steps li',
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->end_controls_tab();

        $control->start_controls_tab(
            'mf_input_tabhover',
            [
                'label' =>esc_html__( 'Hover', 'metform-pro' ),
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'mf_input_option_font_color_hover',
            [
                'label' => esc_html__( 'Color', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'global' => [
                    'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
                ],
                'default' => '#54565C',
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-steps li:hover' => 'color: {{VALUE}}',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'mf_input_option_background_color_hover',
            [
                'label' => esc_html__( 'Background Color', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'global' => [
                    'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
                ],
                'default' => '#D8DDEA',
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-steps li:hover' => 'background-color: {{VALUE}}',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'mf_input_option_border_style_hover',
                'selector' => '{{WRAPPER}} .mf-multistep-container .metform-steps li:hover',
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->end_controls_tab();

        $control->start_controls_tab(
            'mf_input_tabselect',
            [
                'label' =>esc_html__( 'Active', 'metform-pro' ),
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'mf_input_option_font_color_select',
            [
                'label' => esc_html__( 'Color', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'global' => [
                    'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
                ],
                'default' => '#54565C',
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-steps li.active' => 'color: {{VALUE}}',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'mf_input_option_background_color_select',
            [
                'label' => esc_html__( 'Background Color', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::COLOR,
                'global' => [
                    'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Colors::COLOR_PRIMARY,
                ],
                'default'	=> '#D8DDEA',
                'selectors' => [
                    '{{WRAPPER}} .mf-multistep-container .metform-steps li.active' => 'background-color: {{VALUE}}',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'mf_input_option_border_style_selected',
                'selector' => '{{WRAPPER}} .mf-multistep-container .metform-steps li.active',
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->end_controls_tab();
        $control->end_controls_tabs();

        $control->add_control(
            'mf_multistep_icon_heading',
            [
                'label' => esc_html__( 'Icon:', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::HEADING,
                'separator' => 'before',
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->add_control(
            'mf_multistep_icon_position',
            [
                'label' => esc_html__( 'Icon Position', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'row',
                'options' => [
                    'row-reverse'  => esc_html__( 'Right', 'metform-pro' ),
                    'row' => esc_html__( 'Left', 'metform-pro' ),
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
                'selectors' => [
                    '{{WRAPPER}} .metform-step-item'  => 'flex-direction: {{VALUE}};'
                ]
            ]
        );

        $control->add_responsive_control(
            'mf_multistep_icon_size',
            [
                'label' => esc_html__( 'Icon Size', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => [ 'px', '%' ],
                'range' => [
                    'px' => [
                        'min' => 1,
                        'max' => 100,
                        'step' => 5,
                    ],
                    '%' => [
                        'min' => 1,
                        'max' => 100,
                    ],
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
                'selectors' => [
                    '{{WRAPPER}} .metform-step-icon' => 'font-size: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .metform-step-svg-icon' => 'width: {{SIZE}}{{UNIT}};',
                ]
            ]
        );

        $control->add_responsive_control(
            'mf_multistep_icon_spacing',
            [
                'label' => esc_html__( 'Icon Spacing', 'metform-pro' ),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px', '%'],
                'range' => [
                    '%' => [
                        'min' => 0,
                        'max' => 100,
                    ],
                ],
                'selectors' => [
                    '{{WRAPPER}} .metform-step-icon, {{WRAPPER}} .metform-step-svg-icon' => 'margin-right: {{SIZE}}{{UNIT}}; margin-left: {{SIZE}}{{UNIT}};',
                ],
                'condition' => [
                    'mf_form_multistep_display_nav' => 'yes',
                    'mf_form_multistep_status' => 'mf-multistep-container'
                ],
            ]
        );

        $control->start_controls_tabs('mf_multistep_icon_tabs');
            $control->start_controls_tab(
                'mf_multistep_icon_normal_tab',
                [
                    'label' =>esc_html__( 'Normal', 'metform-pro' ),
                    'condition' => [
                        'mf_form_multistep_display_nav' => 'yes',
                        'mf_form_multistep_status' => 'mf-multistep-container'
                    ],
                ]
            );

            $control->add_control(
                'mf_multistep_icon_normal_color',
                [
                    'label' => esc_html__( 'Color', 'metform-pro' ),
                    'type' => \Elementor\Controls_Manager::COLOR,
                    'selectors' => [
                        '{{WRAPPER}} .metform-step-icon' => 'color: {{VALUE}}',
                    ],
                    'condition' => [
                        'mf_form_multistep_display_nav' => 'yes',
                        'mf_form_multistep_status' => 'mf-multistep-container'
                    ],
                ]
            );

            $control->end_controls_tab();

            $control->start_controls_tab(
                'mf_multistep_icon_hover_tab',
                [
                    'label' =>esc_html__( 'Hover', 'metform-pro' ),
                    'condition' => [
                        'mf_form_multistep_display_nav' => 'yes',
                        'mf_form_multistep_status' => 'mf-multistep-container'
                    ],
                ]
            );
            $control->add_control(
                'mf_multistep_icon_hover_color',
                [
                    'label' => esc_html__( 'Color', 'metform-pro' ),
                    'type' => \Elementor\Controls_Manager::COLOR,
                    'selectors' => [
                        '{{WRAPPER}} .metform-step-item:hover .metform-step-icon' => 'color: {{VALUE}}',
                    ],
                    'condition' => [
                        'mf_form_multistep_display_nav' => 'yes',
                        'mf_form_multistep_status' => 'mf-multistep-container'
                    ],
                ]
            );

            $control->end_controls_tab();

            $control->start_controls_tab(
                'mf_multistep_icon_active_tab',
                [
                    'label' =>esc_html__( 'Active', 'metform-pro' ),
                    'condition' => [
                        'mf_form_multistep_display_nav' => 'yes',
                        'mf_form_multistep_status' => 'mf-multistep-container'
                    ],
                ]
            );
            $control->add_control(
                'mf_multistep_icon_active_color',
                [
                    'label' => esc_html__( 'Color', 'metform-pro' ),
                    'type' => \Elementor\Controls_Manager::COLOR,
                    'selectors' => [
                        '{{WRAPPER}} .metform-step-item.active .metform-step-icon' => 'color: {{VALUE}}',
                    ],
                    'condition' => [
                        'mf_form_multistep_display_nav' => 'yes',
                        'mf_form_multistep_status' => 'mf-multistep-container'
                    ],
                ]
            );

            $control->end_controls_tab();
        $control->end_controls_tabs();
		$control->end_controls_section();


        /**
         * End multistep controls
         */

    }
}