<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Prev_Step extends Widget_Base{

	use \MetForm\Traits\Button_Controls;
	use \MetForm\Traits\Conditional_Controls;

    public function get_name() {
		return 'mf-prev-step';
    }

	public function get_icon() {
		return 'mf-widget-icon icon-metform_previous_step';
	}
    
	public function get_title() {
		return esc_html__( 'Prev Step', 'metform-pro' );
    }

	public function show_in_panel() {
        return 'metform-form' == get_post_type();
	}

	public function get_categories() {
		return [ 'metform-pro' ];
	}

	public function has_widget_inner_wrapper(): bool {
		return ! Plugin::$instance->experiments->is_feature_active('e_optimized_markup');
	}

	public function get_keywords() {
        return ['metform', 'button', 'submit', 'submit button', 'prev step'];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/pro-features-multi-step-form/#get-started';
    }
	
    protected function register_controls() {

        $this->start_controls_section(
			'mf_btn_section_content',
			[
				'label' => esc_html__( 'Content', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_CONTENT,
			]
        );

        $this->button_content_control();

		$this->end_controls_section();

		if(class_exists('\MetForm_Pro\Base\Package')){
			$this->input_conditional_control();
		}

        $this->start_controls_section(
			'mf_btn_section_style',
			[
				'label' =>esc_html__( 'Button', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
        );

        $this->button_style_control();
        
		$this->end_controls_section();




        $this->start_controls_section(
			'mf_btn_border_style_tabs',
			[
				'label' =>esc_html__( 'Border', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
        );
        
        $this->button_border_control();
        
		$this->end_controls_section();

        $this->start_controls_section(
			'mf_btn_box_shadow_style',
			[
				'label' =>esc_html__( 'Shadow', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
        );
        
        $this->button_shadow_control();

		$this->end_controls_section();

        $this->start_controls_section(
			'mf_btn_iconw_style',
			[
				'label' =>esc_html__( 'Icon', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
				'condition' => ['mf_btn_icon!' => '']
			]
        );
        
        $this->button_icon_control();

		$this->end_controls_section();

	}

    protected function render($instance = []){

        $settings = $this->get_settings_for_display();

		$render_on_editor = false;
		$is_edit_mode = 'metform-form' === get_post_type() && \Elementor\Plugin::$instance->editor->is_edit_mode();

        $btn_text = $settings['mf_btn_text'];
        $btn_class = ($settings['mf_btn_class'] != '') ? $settings['mf_btn_class'] : '';
        $btn_id = ($settings['mf_btn_id'] != '') ? 'id='.$settings['mf_btn_id'] : '';
		$icon_align = $settings['mf_btn_icon_align'];

		$class = (isset($settings['mf_conditional_logic_form_list']) ? 'mf-conditional-input' : '');
		?>
		<div class="mf-btn-wraper <?php echo esc_attr($class); ?>">
			<?php if($icon_align == 'right'): ?>
				<button type="button"
						class="metform-btn metfrom-prev-step <?php echo esc_attr( $btn_class ); ?>"
						<?php echo esc_attr($btn_id); ?>
						data-direction="prev"
						<?php if ( !$is_edit_mode ): ?>
						onClick=${ parent.handleMultiStepBtns }
						<?php endif; ?>
						>
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($btn_text), $render_on_editor ); ?>
					<?php if($settings['mf_btn_icon']['value'] != ''): ?><?php Icons_Manager::render_icon( $settings['mf_btn_icon'], [ 'aria-hidden' => 'true' ] ); ?><?php endif; ?>
				</button>
				<?php elseif ($icon_align == 'left') : ?>
				<button type="button"
						class="metform-btn metfrom-prev-step <?php echo esc_attr( $btn_class); ?>"
						<?php echo esc_attr($btn_id); ?>
						data-direction="prev"
						<?php if ( !$is_edit_mode ): ?>
						onClick=${ parent.handleMultiStepBtns }
						<?php endif; ?>
						>
					<?php if($settings['mf_btn_icon']['value'] != ''): ?><?php Icons_Manager::render_icon( $settings['mf_btn_icon'], [ 'aria-hidden' => 'true' ] ); ?><?php endif; ?>
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($btn_text), $render_on_editor ); ?>
				</button>
				<?php else : ?>
				<button type="button"
						class="metform-btn metfrom-prev-step <?php echo esc_attr( $btn_class); ?>"
						<?php echo esc_attr($btn_id); ?>
						data-direction="prev"
						<?php if ( !$is_edit_mode ): ?>
						onClick=${ parent.handleMultiStepBtns }
						<?php endif; ?>
						>
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($btn_text), $render_on_editor ); ?>
				</button>
			<?php endif; ?>
        </div>
        <?php
    }
}
