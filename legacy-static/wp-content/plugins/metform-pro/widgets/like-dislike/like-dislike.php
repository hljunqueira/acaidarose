<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Input_Like_Dislike extends Widget_Base{
	use \MetForm\Traits\Common_Controls;
	use \MetForm\Traits\Conditional_Controls;
	
	public function __construct( $data = [], $args = null ) {
		parent::__construct( $data, $args );

		if ( class_exists('\Elementor\Icons_Manager') && method_exists('\Elementor\Icons_Manager', 'enqueue_shim') ) {
			\Elementor\Icons_Manager::enqueue_shim();
		}
	}
    
    public function get_name(){
        return 'mf-like-dislike';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_like_dislike';
	}

    public function get_title(){
        return esc_html__( 'Like Dislike', 'metform-pro' );
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
        return [ 'metform-pro', 'input', 'like', 'dislike' ];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list/#like-dislike-';
    }

    protected function register_controls(){

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
				'label' => __( 'Validation Type', 'metform-pro' ),
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
		
		/**
		 * Icons Style
		 */
		$this->start_controls_section(
			'mf_icons_style',
			[
				'label'	=> esc_html__( 'Like Dislike Icons', 'metform-pro' ),
				'tab'	=> Controls_Manager::TAB_STYLE,
			]
		);
			$this->add_responsive_control(
				'mf_icons_size',
				[
					'label'			=> esc_html__( 'Font Size (px)', 'metform-pro' ),
					'type'			=> Controls_Manager::NUMBER,
					'placeholder'	=> '18',
					'selectors'		=> [
						'{{WRAPPER}} .attr-btn' => 'font-size: {{VALUE}}px;',
					]
				]
			);
			
			$this->add_responsive_control(
				'mf_icons_spacing',
				[
					'label'			=> esc_html__( 'Spacing (px)', 'metform-pro' ),
					'type'			=> Controls_Manager::NUMBER,
					'placeholder'	=> '15',
					'selectors'		=> [
						'{{WRAPPER}} .mf-input-like' => 'margin-right: {{VALUE}}px;',
					]
				]
			);

			$this->add_control(
				'mf_like_size_hr',
				[
					'type' => \Elementor\Controls_Manager::DIVIDER,
				]
			);

			/**
			 * Like Icon Tabs
			 */
			$this->start_controls_tabs(
				'mf_like_style_tabs'
			);
				/**
				 * Like Icon Normal Tab
				 */
				$this->start_controls_tab(
					'mf_like_style_tab_1',
					[
						'label' =>esc_html__( 'Normal', 'metform-pro' ),
					]
				);
					$this->add_control(
						'mf_like_color_1',
						[
							'label'		=> esc_html__( 'Like Icon Color', 'metform-pro' ),
							'type'		=> Controls_Manager::COLOR,
							'selectors' => [
								'{{WRAPPER}} .mf-input-like' => 'color: {{VALUE}};',
							],
						]
					);
					
					$this->add_control(
						'mf_dislike_color_1',
						[
							'label'		=> esc_html__( 'Dislike Icon Color', 'metform-pro' ),
							'type'		=> Controls_Manager::COLOR,
							'selectors' => [
								'{{WRAPPER}} .mf-input-dislike' => 'color: {{VALUE}};',
							],
						]
					);
				$this->end_controls_tab();

				/**
				 * Like Icon Hover Tab
				 */
				$this->start_controls_tab(
					'mf_like_style_tab_2',
					[
						'label' =>esc_html__( 'Hover', 'metform-pro' ),
					]
				);
					$this->add_control(
						'mf_like_color_2',
						[
							'label'		=> esc_html__( 'Like Icon Color', 'metform-pro' ),
							'type'		=> Controls_Manager::COLOR,
							'selectors' => [
								'{{WRAPPER}} .mf-input-like:hover' => 'color: {{VALUE}};',
							],
						]
					);

					$this->add_control(
						'mf_dislike_color_2',
						[
							'label'		=> esc_html__( 'Dislike Icon Color', 'metform-pro' ),
							'type'		=> Controls_Manager::COLOR,
							'selectors' => [
								'{{WRAPPER}} .mf-input-dislike:hover' => 'color: {{VALUE}};',
							],
						]
					);
				$this->end_controls_tab();

				/**
				 * Like Icon Active Tab
				 */
				$this->start_controls_tab(
					'mf_like_style_tab_3',
					[
						'label' =>esc_html__( 'Active', 'metform-pro' ),
					]
				);
					$this->add_control(
						'mf_like_color_3',
						[
							'label'		=> esc_html__( 'Like Icon Color', 'metform-pro' ),
							'type'		=> Controls_Manager::COLOR,
							'selectors' => [
								'{{WRAPPER}} .mf-input:checked + .mf-input-like' => 'color: {{VALUE}};',
							],
						]
					);

					$this->add_control(
						'mf_dislike_color_3',
						[
							'label'		=> esc_html__( 'Dislike Icon Color', 'metform-pro' ),
							'type'		=> Controls_Manager::COLOR,
							'selectors' => [
								'{{WRAPPER}} .mf-input:checked + .mf-input-dislike' => 'color: {{VALUE}};',
							],
						]
					);
				$this->end_controls_tab();
				$this->end_controls_tab();
			$this->end_controls_tabs();
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
    
    protected function render(){
        $settings = $this->get_settings_for_display();
		extract($settings);
		$id = $this->get_id();

		$render_on_editor = false;
		$is_edit_mode = 'metform-form' === get_post_type() && \Elementor\Plugin::$instance->editor->is_edit_mode();

		$class = (isset($settings['mf_conditional_logic_form_list']) ? 'mf-conditional-input' : '');

		$configData = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : esc_html__('This field is required.', 'metform-pro') : esc_html__('This field is required.', 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false,
		];
        ?>

		<div class="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label class="mf-input-label" for="mf-inputmobile--<?php echo esc_attr( $this->get_id() ); ?>">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span class="mf-input-required-indicator"><?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?></span>
				</label>
			<?php endif; ?>

			<div class="mf-input mf-parent-like-dislike" aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>'] ? 'true' : 'false'} id="mf-input-radio-<?php echo esc_attr($this->get_id()); ?>">
				<div class="mf-radio-option">
					<label> 
						<input
							type="radio"
							class="mf-input mf-radio-input"
							name="<?php echo esc_attr($mf_input_name); ?>"
							value="1"
							<?php if ( !$is_edit_mode ) : ?>
								onChange=${ parent.handleChange }
								aria-invalid=${validation.errors['<?php echo esc_attr($mf_input_name); ?>'] ? 'true' : 'false'}
								ref=${ el => parent.activateValidation(<?php echo json_encode($configData); ?>, el) }
								checked=${'1' === parent.getValue('<?php echo esc_attr( $mf_input_name ); ?>')}
							<?php endif; ?>
							/>
						<i class="fa fa-thumbs-up fa-lg attr-btn mf-input-like" aria-hidden="true"></i>
					</label>
					<label> 
						<input type="radio" class="mf-input mf-radio-input" 
							name="<?php echo esc_attr($mf_input_name); ?>" 
							value="0"
							<?php if ( !$is_edit_mode ) : ?>
								onChange=${ parent.handleChange }
								ref=${ el => parent.activateValidation(<?php echo json_encode($configData); ?>, el) }
								checked=${'0' === parent.getValue('<?php echo esc_attr( $mf_input_name ); ?>')}
							<?php endif; ?>
							/>
						<i class="fa fa-thumbs-down fa-lg attr-btn mf-input-dislike" aria-hidden="true"></i>
					</label>
				</div>
			</div>

			<?php if ( !$is_edit_mode ) : ?>
				<${validation.ErrorMessage}
					errors=${validation.errors}
					name="<?php echo esc_attr( $mf_input_name ); ?>"
					as=${html`<span className="mf-error-message"></span>`}
					/>
			<?php endif; ?>

			<?php echo '' != $mf_input_help_text ? '<span class="mf-input-help">'. \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_help_text), $render_on_editor ) .'</span>' : ''; ?>
		</div>

		<?php
    }
}
