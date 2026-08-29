<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Input_Color_Picker extends Widget_Base{

	use \MetForm\Traits\Common_Controls;
	use \MetForm\Traits\Conditional_Controls;

    public function get_name() {
		return 'mf-color-picker';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_color_picker';
	}
    
	public function get_title() {
		return esc_html__( 'Color picker', 'metform-pro' );
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
        return ['metform-pro', 'input', 'color', 'picker', 'select color', 'choose color'];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list/#color-picker-';
    }

    protected function register_controls() {
        
        $this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'Content', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->input_content_controls(['NO_PLACEHOLDER']);

        $this->end_controls_section();

        $this->start_controls_section(
			'settings_section',
			[
				'label' => esc_html__( 'Settings', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->input_setting_controls(['MAX_MIN']);

		$this->add_control(
			'mf_input_validation_type',
			[
				'label' => esc_html__( 'Validation Type', 'metform-pro' ),
				'type' => \Elementor\Controls_Manager::HIDDEN,
				'default' => 'none',
			]
		);

		$this->end_controls_section();
		
		if(class_exists('\MetForm_Pro\Base\Package')){
			$this->input_conditional_control();
		}
		
        $this->start_controls_section(
			'label_section',
			[
				'label' => esc_html__( 'Label', 'metform-pro' ),
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

		$this->input_label_controls();

        $this->end_controls_section();

        $this->start_controls_section(
			'color_picker_section',
			[
				'label' => esc_html__( 'Picker', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
        );

		$this->add_responsive_control(
			'mf_color_picker_width',
			[
				'label' => esc_html__( 'Width', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
					'px' => [
						'min' => 20,
						'max' => 100,
						'step' => 1,
					],
				],
				'default' => [
                    'unit' => 'px',
                    'size' => 50,
                ],
				'selectors' => [
					'{{WRAPPER}} .mf-color-picker ' => 'width: {{SIZE}}{{UNIT}}',
				]
			]
		);

		$this->add_responsive_control(
			'mf_color_picker_height',
			[
				'label' => esc_html__( 'Height', 'metform-pro' ),
                'type' => Controls_Manager::SLIDER,
                'range' => [
					'px' => [
						'min' => 20,
						'max' => 100,
						'step' => 1,
					],
				],
				'selectors' => [
					'{{WRAPPER}} .mf-color-picker' => 'height: {{SIZE}}{{UNIT}}',
				]
			]
		);

		$this->add_responsive_control(
			'mf_color_picker_padding',
			[
				'label' => esc_html__( 'Padding', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-color-picker' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);
		$this->add_responsive_control(
			'mf_color_picker_margin',
			[
				'label' => esc_html__( 'Margin', 'metform-pro' ),
				'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
				'selectors' => [
					'{{WRAPPER}} .mf-color-picker' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
				],
			]
		);
		$this->add_responsive_control(
            'mf_color_picker_border_radius',
            [
                'label' => esc_html__( 'Border Radius', 'metform-pro' ),
                'type' => Controls_Manager::DIMENSIONS,
                'size_units' => [ 'px', '%', 'em' ],
                'selectors' => [
                    '{{WRAPPER}} .mf-color-picker' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );
		$this->add_group_control(
			Group_Control_Border::get_type(),
			[
				'name' => 'mf_color_picker_border',
				'label' => esc_html__( 'Border', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-color-picker',
			]
		);

		$this->add_group_control(
			Group_Control_Box_Shadow::get_type(),
			[
				'name' => 'mf_color_picker_box_shadow',
				'label' => esc_html__( 'Box Shadow', 'metform-pro' ),
				'selector' => '{{WRAPPER}} .mf-color-picker',
			]
		);


        $this->end_controls_section();

        $this->start_controls_section(
			'help_text_section',
			[
				'label' => esc_html__( 'Help Text', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => [
					'mf_input_help_text!' => ''
				]
			]
		);
		
		$this->input_help_text_controls();

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
		?>

		<?php echo $inputWrapStart; ?>

		<div className="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label className="mf-input-label" htmlFor="mf-input-map-<?php echo esc_attr( $this->get_id() ); ?>">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span className="mf-input-required-indicator"><?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?></span>
				</label>
			<?php endif; ?>

			
			<${props.InputColor}
				initialValue=${parent.state.formData['<?php echo esc_attr($mf_input_name); ?>'] || '#000000'}
				onChange=${(setColor) => parent.colorChange(setColor, '<?php echo esc_attr($mf_input_name); ?>')}
				className="mf-color-picker"
			/>

			 

			<input type="hidden"
				className="mf-input mf-input-color-picker-react <?php echo $class; ?>"
				id="mf-input-map-<?php echo esc_attr($this->get_id()); ?>"
				name="<?php echo esc_attr($mf_input_name); ?>"
				value=${parent.state.formData['<?php echo esc_attr($mf_input_name); ?>'] || '#000000'}
				onInput=${parent.colorChangeInput}
				aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>'] ? 'true' : 'false'}
				ref=${ el => parent.activateValidation(<?php echo json_encode($configData); ?>, el) }
				readOnly
				/>

			<${validation.ErrorMessage} errors=${validation.errors} name="<?php echo esc_attr($mf_input_name); ?>" as=${html`<span className="mf-error-message"></span>`} />
			
			<?php echo '' != $mf_input_help_text ? '<span className="mf-input-help">'. \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_help_text), $render_on_editor ) .'</span>' : ''; ?>
		</div>

		<?php echo $inputWrapEnd; ?>

		<?php
    }
    
}

