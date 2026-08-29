<?php

namespace MetForm_Pro\Core\Integrations\Post\Form_To_Post;

use MetForm_Pro\Traits\Singleton;
use MetForm_Pro\Utils\Render;

/**
 * Save Form entries as post
 */
class Loader
{
    use Singleton;

    public $id = 'mf-form-to-post';
    public $label = 'Post';

    public function init()
    {

        add_action('mf_form_settings_tab', [$this, 'tab']);
        add_action('mf_form_settings_tab_content', [$this, 'tab_content']);

        add_action('mf_push_tab_content_' . $this->id, [$this, 'settings_content']);

        add_action('rest_api_init', function() {

            register_rest_route('xs/post', '/settings/(?P<id>\d+)', [
                'methods'  => 'GET',
                'callback' => [$this, 'rest_func'],
                'permission_callback' => '__return_true',
            ]);

        });

    }

    public function rest_func($request) {
        $id = $request['id'];

        return [
                'fields_settings' => get_option('mf_post_submission_' . $id),
                'custom_fields_settings' => get_option('mf_post_submission_custom_fields_' . $id),
        ];
    }


    public function tab()
    {
        Render::form_tab($this->id, $this->label);
    }

    public function tab_content()
    {
        Render::form_tab_content($this->id);
    }

    public function settings_content()
    {
        $data = [
            'name' => 'mf_form_to_post',
            'label' => 'Form To Post',
            'class' => 'mf-form-to-post',
            'details' => 'Create a post from form entries',
        ];

        Render::checkbox($data);

        Render::seperator();
        Render::div('', 'mf-input-group mf-input-group-inline', $this->form_field_content());
    }

    public function form_field_content()
    {
        ?>
        <div class="mf-form-to-post-fields">

            <div class="mf-form-to-post-fields-section">
                <div class="mf-input-group mf-input-group-inline mf-form-bottom-spacing">
                    <label class="attr-input-label">Post Type</label>
                    <div class="mf-inputs">
                        <select name="mf_post_submission_post_type" class="attr-form-control mf_post_submission_post_type">
                            <?php foreach (get_post_types() as $key => $value): ?>
                                <option value="<?php echo esc_attr($key); ?>"><?php echo esc_html($value); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>

                <div class="mf-input-group mf-input-group-inline mf-form-bottom-spacing">
                    <label class="attr-input-label">Author</label>
                    <div class="mf-inputs">
                        <select name="mf_post_submission_author" class="attr-form-control mf_post_submission_author">
                            <?php foreach (get_users() as $user): ?>
                                <option value="<?php echo esc_attr($user->ID); ?>"><?php echo esc_html($user->display_name); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
            </div>

            <div class="mf-post-submission-fields-section"></div>
        </div>

        <?php
    }

}

Loader::instance()->init();
