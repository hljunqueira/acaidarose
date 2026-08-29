<?php
namespace MetForm_Pro\Core\Integrations;

defined('ABSPATH') || exit;

class Multistep_Section_Settings
{

    public function __construct()
    {
        add_action('elementor/element/section/section_layout/after_section_end', array($this, 'register_controls'), 10, 2);
        add_action('elementor/element/container/section_layout_container/after_section_end', array($this, 'register_controls'), 10, 2);
    }

    public function register_controls($control, $args)
    {


        $field_type_settings_title = $field_type_settings_icon = \Elementor\Controls_Manager::HIDDEN;

        if ('metform-form' == get_post_type()) {
            $field_type_settings_title = \Elementor\Controls_Manager::TEXT;
            $field_type_settings_icon = \Elementor\Controls_Manager::ICONS;
        }

        $control->start_controls_section(
            'metform_multistep_settings_section',
            [
                'label' => esc_html__('Multistep', 'metform-pro'),
                'tab' => \Elementor\Controls_Manager::TAB_LAYOUT,
            ]
        );



        $control->add_control(
            'metform_multistep_settings_title',
            [
                'label' => esc_html__('Multistep Tab Title', 'metform-pro'),
                'type' => $field_type_settings_title,
                'label_block' => true,
                'hide_in_inner' => true,
                'render_type' => 'none',
                'frontend_available' => true,
            ]
        );

        $control->add_control(
            'metform_multistep_settings_icon',
            [
                'label' => esc_html__('Multistep Tab Icon', 'metform-pro'),
                'type' => $field_type_settings_icon,
                'label_block' => true,
                'hide_in_inner' => true,
                'render_type' => 'none',
                'frontend_available' => true,
            ]
        );

        $control->end_controls_section();

    }
}