<?php
namespace MetForm_Pro\Core\Integrations;

use Elementor\Controls_Manager;
use Elementor\Group_Control_Typography;
use Elementor\Group_Control_Border;

defined( 'ABSPATH' ) || exit;

Class Response_Message_Controls{
    public function __construct( ){
        add_action('elementor/element/metform/multistep_section/after_section_end', array( $this, 'register_controls' ), 5, 2);
    }

    public function register_controls($control, $args){

        /*
			----------------------------------------------
			* @controlsFor : Customizing Success Message
			* @since 1.3.17 (free)
			----------------------------------------------
		*/ 

        $control->start_controls_section(
			'response_section',
			[
				'label' => esc_html__( 'Response Message', 'metform-pro' ),
				'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
			]
		);

		$control->add_control(
            'mf_response_type',
            [
                'label' =>esc_html__( 'Response Type', 'metform-pro' ),
                'type' => Controls_Manager::SELECT,
                'default' => 'alert',
                'options' => [
                    'alert' =>esc_html__( 'Alert', 'metform-pro' ),
					'cute_alert' =>esc_html__( 'Pop Alert Box', 'metform-pro' ),
                ]
            ]
        );

		$control->add_control(
            'mf_success_controls',
            [
            'label' => esc_html__( 'Edit Response Message', 'metform-pro' ),
				'type' => Controls_Manager::SWITCHER,
				'label_on' => esc_html__( 'Show', 'metform-pro' ),
				'label_off' => esc_html__( 'Hide', 'metform-pro' ),
				'return_value' => 'yes',
				'default' => 'no',
				'condition' => [
					'mf_response_type' => 'alert'
					]
            ]
		);

		

		$control->start_controls_tabs(
			'Settings',
			[
				'conditions' =>  [
					'relation' => 'and',
					'terms' => [
						[
							'name' => 'mf_success_controls',
							'operator' => '==',
							'value' => 'yes'    
						],
						[
							'name' => 'mf_response_type',
							'operator' => '==',
							'value' => 'alert'    
						]
					]
				],
			]
		);
		// settings tab
		$control->start_controls_tab(
			'mf_success_setting',
			[
				'label' => esc_html__( 'Settings', 'metform-pro' ),
			]
		);

		$control->add_responsive_control(
			'mf_response_display_position',
			[
				'label' => esc_html__( 'Message Position', 'metform-pro' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'top',
				'options' => [
					'top'  => esc_html__( 'Top', 'metform-pro' ),
					'bottom' => esc_html__( 'Bottom', 'metform-pro' ),
				]
			]
		);

		$control->add_responsive_control(
			'mf_success_display_style',
			[
				'label' => esc_html__( 'Icon Position', 'metform-pro' ),
				'type' => Controls_Manager::SELECT,
				'default' => 'block',
				'options' => [
					'block'  => esc_html__( 'Top', 'metform-pro' ),
					'flex' => esc_html__( 'Side', 'metform-pro' ),
				],
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-response-msg' => 'display: {{VALUE}};align-items: center;',
				],
			]
		);


		$control->add_control( 
			'mf_success_content_alignment', 
				[
					'label' =>esc_html__( 'Content Alignment', 'metform-pro' ),
					'type' => Controls_Manager::CHOOSE,
					'options' => [
						'left'    => [
							'title' =>esc_html__( 'Left', 'metform-pro' ),
							'icon' => 'fa fa-align-left',
						],
						'center' => [
							'title' =>esc_html__( 'Center', 'metform-pro' ),
							'icon' => 'fa fa-align-center',
						],
						'right' => [
							'title' =>esc_html__( 'Right', 'metform-pro' ),
							'icon' => 'fa fa-align-right',
						],
					],
					'default' => 'flex-center',
					'selectors' => [
						'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated :is(.mf-response-msg, p)' => 'text-align: {{VALUE}};',
					],
					'conditions' =>  [
						'relation' => 'and',
						'terms' => [
							[
								'name' => 'mf_success_display_style',
								'operator' => '==',
								'value' => 'block'    
							],
							[
								'name' => 'mf_success_controls',
								'operator' => '==',
								'value' => 'yes'
							],
							[
								'name' => 'mf_response_type',
								'operator' => '==',
								'value' => 'alert'    
							]
						]
					],
			]
		);

		$control->add_control( 
			'mf_success_content_alignment_flex', 
				[
					'label' =>esc_html__( 'Content Alignment', 'metform-pro' ),
					'type' => Controls_Manager::CHOOSE,
					'options' => [
						'flex-start'    => [
							'title' =>esc_html__( 'Left', 'metform-pro' ),
							'icon' => 'fa fa-align-left',
						],
						'center' => [
							'title' =>esc_html__( 'Center', 'metform-pro' ),
							'icon' => 'fa fa-align-center',
						],
						'flex-end' => [
							'title' =>esc_html__( 'Right', 'metform-pro' ),
							'icon' => 'fa fa-align-right',
						],
					],
					'default' => 'center',
					'selectors' => [
						'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-response-msg' => 'justify-content: {{VALUE}};',
						'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-response-msg p' => 'text-align: left',
					],
					'conditions' =>  [
						'relation' => 'and',
						'terms' => [
							[
								'name' => 'mf_success_display_style',
								'operator' => '==',
								'value' => 'flex'    
							],
							[
								'name' => 'mf_success_controls',
								'operator' => '==',
								'value' => 'yes'
							],
							[
								'name' => 'mf_response_type',
								'operator' => '==',
								'value' => 'alert'    
							]
						]
					],
			]
		);

		$control->add_control(
			'mf_success_duration',
			[
				'label' => esc_html__( 'Keep Message for (seconds)', 'metform-pro' ),
				'type' => Controls_Manager::NUMBER,
				'min' => 0,
				'default' => 5,
				'frontend_available' => true,
			]
		);

		$control->add_control(
			'hr_display',
			[
				'type' => Controls_Manager::DIVIDER,
			]
		);
		

		$control->add_control(
			'mf_success_icon',
			[
				'label' => esc_html__( 'Success Icon', 'metform-pro' ),
				'label_block' => false,
				'type' => Controls_Manager::ICONS,
				'default' => [
					'value' => 'fas fa-check',
					'library' => 'solid'
				],
				'skin'	=> 'inline',
				'exclude_inline_options' => ['svg']
			]
		);

		$control->add_control(
			'mf_error_icon',
			[
				'label' => esc_html__( 'Error Icon', 'metform-pro' ),
				'label_block' => false,
				'type' => Controls_Manager::ICONS,
				'default' => [
					'value' => 'fas fa-exclamation-triangle',
					'library' => 'solid'
				],
				'skin'	=> 'inline',
				'exclude_inline_options' => ['svg']
			]
		);

		

		

		

		$control->end_controls_tab();





		// style tab
		$control->start_controls_tab(
			'mf_success_style',
			[
				'label' => esc_html__( 'Style', 'metform-pro' )
			]
		);



		$control->add_responsive_control(
			'mf_success_icon_size',
			[
				'label' => esc_html__( 'Icon Size', 'metform-pro' ),
				'type' => Controls_Manager::SLIDER,
				'size_units' => [ 'px'],
				'range' => [
					'px' => [
						'min' => 0,
						'max' => 200,
						'step' => 1,
					]
				],
				'default' => [
					'unit' => 'px',
					'size' => 30,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-success-icon' => 'font-size: {{SIZE}}{{UNIT}};',
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-alert-icon' => 'font-size: {{SIZE}}{{UNIT}};',
				],
			]
		);

		$control->add_responsive_control(
			'mf_success_width',
			[
				'label' => esc_html__( 'Container Width', 'metform-pro' ),
				'type' => Controls_Manager::SLIDER,
				'size_units' => [ 'px', '%'],
				'range' => [
					'px' => [
						'min' => 0,
						'max' => 2000,
						'step' => 10,
					],
					'%' => [
						'min' => 0,
						'max' => 200,
					],
				],
				'default' => [
					'unit' => '%',
					'size' => 100,
				],
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated' => 'width: {{SIZE}}{{UNIT}};margin: 0 auto;',
				],
			]
		);

		$control->add_group_control(
			Group_Control_Typography::get_type(),
			[
				'name' => 'mf_success_typography',
				'label' => esc_html__( 'Typography', 'metform-pro' ),
				'global' => [
					'default' => \Elementor\Core\Kits\Documents\Tabs\Global_Typography::TYPOGRAPHY_PRIMARY,
				],
				'selector' => '{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated p',
			]
		);

		$control->add_control(
			'hr_typo',
			[
				'type' => Controls_Manager::DIVIDER,
			]
		);

		$control->add_control(
			'mf_success_text_color',
			[
				'label' => esc_html__( 'Success Message Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated p' => 'color: {{VALUE}}',
				],
			]
		);

		$control->add_control(
			'mf_error_text_color',
			[
				'label' => esc_html__( 'Error Message Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated.mf-error-res p' => 'color: {{VALUE}}',
				],
			]
		);

		$control->add_control(
			'mf_success_text_icon_color',
			[
				'label' => esc_html__( 'Success Icon Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-success-icon' => 'color: {{VALUE}}',
				],
			]
		);
		$control->add_control(
			'mf_error_text_icon_color',
			[
				'label' => esc_html__( 'Error Icon Color', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated.mf-error-res .mf-alert-icon' => 'color: {{VALUE}}',
				],
			]
		);

		$control->add_control(
			'mf_success_text_bg_color',
			[
				'label' => esc_html__( 'Success Message Background', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-response-msg' => 'background-color: {{VALUE}}',
				],
			]
		);
		


		$control->add_control(
			'mf_error_text_bg_color',
			[
				'label' => esc_html__( 'Error Message Background', 'metform-pro' ),
				'type' => Controls_Manager::COLOR,
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated.mf-error-res .mf-response-msg' => 'background-color: {{VALUE}}',
				],
			]
		);

		$control->add_control(
			'hr_color',
			[
				'type' => Controls_Manager::DIVIDER,
			]
		);

		$control->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_success_border',
				'label' => esc_html__( 'Border', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-response-msg',
			]
		);

		$control->add_control(
			'hr_dimension',
			[
				'type' => Controls_Manager::DIVIDER,
			]
		);

		$control->add_responsive_control(
			'mf_success_border_radius',
			[
				'label' => esc_html__( 'Border Radius', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-response-msg' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$control->add_responsive_control(
			'mf_success_container_padding',
			[
				'label' => esc_html__( 'Container Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-response-msg' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$control->add_responsive_control(
			'mf_success_icon_margin',
			[
				'label' => esc_html__( 'Icon Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-success-icon' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated .mf-alert-icon' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);

		$control->add_responsive_control(
			'mf_success_container_margin',
			[
				'label' => esc_html__( 'Container Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
				'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-main-response-wrap.mf_pro_activated' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);


		$control->end_controls_tab();
		$control->end_controls_tabs();
		$control->end_controls_section();

		// @endof : Customizing Success Message

    }
}