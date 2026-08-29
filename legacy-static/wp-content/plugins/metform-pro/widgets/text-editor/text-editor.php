<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Text_Editor extends Widget_Base{

	use \MetForm\Traits\Common_Controls;
    use \MetForm\Traits\Conditional_Controls;
    
    public function __construct( $data = [], $args = null ) {
		parent::__construct( $data, $args );

		if ( class_exists('\Elementor\Icons_Manager') && method_exists('\Elementor\Icons_Manager', 'enqueue_shim') ) {
			\Elementor\Icons_Manager::enqueue_shim();
		}
	}

    public function get_name() {
		return 'mf-text-editor';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_text_editor';
	}
    
	public function get_title() {
		return esc_html__( 'Text Editor', 'metform-pro' );
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
        return [ 'metform-pro', 'text editor', 'textarea', 'input'];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list';
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
				'description' => esc_html__('for adding label on editor turn it on. Don\'t want to use label? turn it off.', 'metform-pro'),
			]
		);

        $this->add_control(
			'mf_input_label',
			[
				'label' => esc_html__( 'Editor Label : ', 'metform-pro' ),
				'type' => Controls_Manager::TEXT,
				'default' => $this->get_title(),
				'title' => esc_html__( 'Enter here label of editor', 'metform-pro' ),
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
				'frontend_available' => true,
				'title' => esc_html__( 'Enter here name of the editor', 'metform-pro' ),
				'description' => esc_html__('Name is must required. Enter name without space or any special character. use only underscore/ hyphen (_/-) for multiple word. Name must be different.', 'metform-pro'),
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

		$this->start_controls_section(
			'settings_section',
			[
				'label' => esc_html__( 'Settings', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
		);

		$this->input_setting_controls();

		$this->input_get_params_controls();

		$this->add_control(
			'mf-text-editor-size',
			[
				'label' => esc_html__( 'Editor Size', 'metform-pro' ),
				'type' => Controls_Manager::SELECT,
				'default' => '200px',
				'options' => [
					'100px' => esc_html__( 'Small', 'metform-pro' ),
					'200px' => esc_html__( 'Medium', 'metform-pro' ),
					'500px' => esc_html__( 'Large', 'metform-pro' ),
                ],
                'selectors' => [
					'{{WRAPPER}} .mf-text-editor .ql-editor' => 'min-height: {{VALUE}}',
				],
				'description' => esc_html__('Select editor size.How look like editor you want to see.', 'metform-pro'),
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
            'mf-text-editor-container',
            [
                'label' => esc_html__('Editor', 'metform-pro'),
                'tab' => Controls_Manager::TAB_STYLE,
            ]
        );
			$this->add_responsive_control(
				'mf_editor_padding',
				[
					'label' => esc_html__( 'Padding', 'metform-pro' ),
					'type' => Controls_Manager::DIMENSIONS,
					'size_units' => [ 'px', '%', 'em' ],
					'selectors' => [
						'{{WRAPPER}} .mf-text-editor .ql-editor' => 'padding: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					],
				]
			);

			$this->add_responsive_control(
				'mf_editor_margin',
				[
					'label' => esc_html__( 'Margin', 'metform-pro' ),
					'type' => Controls_Manager::DIMENSIONS,
					'size_units' => [ 'px', '%', 'em' ],
					'selectors' => [
						'{{WRAPPER}} .mf-text-editor' => 'margin: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
					],
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

		$this->add_control(
			'mf_input_validation_type',
			[
				'label' => __( 'Validation Type', 'metform-pro' ),
				'type' => \Elementor\Controls_Manager::HIDDEN,
				'default' => 'none',
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

		$uid = $this->get_id() .'-'. $mf_input_name;

		$configData = [
			'message' 		=> $errorMessage 	= isset($mf_input_validation_warning_message) ? !empty($mf_input_validation_warning_message) ? $mf_input_validation_warning_message : esc_html__('This field is required.', 'metform-pro') : esc_html__('This field is required.', 'metform-pro'),
			'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false,
		];
		?>

		<?php echo $inputWrapStart; ?>

		<div className="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label className="mf-editor-label mf-input-label">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span className="mf-input-required-indicator">
						<?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?>
					</span>
				</label>
			<?php endif; ?>

			<div className="mf-text-editor" id="mf-text-editor-<?php echo esc_attr($this->get_id()); ?>" aria-invalid=${validation.errors[ '<?php echo esc_attr($mf_input_name); ?>' ] ? 'true' : 'false'}>
			 
			<${props.TextEditor}
			id="mf-text-editor-<?php echo esc_attr($this->get_id()); ?>"
			onChange=${(value) => parent.handleEditorState({ value, name: "<?php echo esc_attr($mf_input_name); ?>" })}
			value=${parent.getValue('<?php echo esc_attr($mf_input_name); ?>')}
			parent=${parent}
			isReadOnly=${<?php echo $is_edit_mode ? 'true' : 'false'; ?>}
			/>



			
			</div>

			<?php if ( !$is_edit_mode ) : ?>
				<input
			    type="hidden"
			    name="<?php echo esc_attr( $mf_input_name ); ?>"
			    className="mf-input mf-editor-hidden"
			    value=${ parent.getValue( '<?php echo esc_attr( $mf_input_name ); ?>' ) }
			    ref=${ (el) => parent.activateValidation(<?php echo json_encode($configData); ?>, el) }
			    />
	
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
