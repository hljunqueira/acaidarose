<?php

namespace MetForm_Pro\Core\Integrations\Post\Form_To_Post;

defined('ABSPATH') || exit;

class Post
{
    public function create_post($form_data, $form_settings, $form_id, $entry_id, $file_upload_info)
    {
        $post_id = wp_insert_post($this->mf_post_data($form_settings, $form_data));

        $custom_fields = get_option('mf_post_submission_custom_fields_' . $form_id);
        if ($custom_fields) {
            foreach ($custom_fields as $field_name => $metform_field) {
                if(isset($form_data[$metform_field])) {
                    update_post_meta($post_id, $field_name, $form_data[$metform_field]);
                }
            }
        }

        if (!empty($file_upload_info)) {
            $this->mf_set_thumbnail($post_id, $file_upload_info, $form_settings);

            if(is_array($file_upload_info)){
                foreach($file_upload_info as $key => $file_upload_info){
                    $custom_file_name = $this->hasCustomField($key, $custom_fields);
                    if($custom_file_name){                        
                        foreach($file_upload_info as $value){    
                            $file_url = isset($value['url']) ? $value['url'] : '';                      
                            update_post_meta($post_id, $custom_file_name, $file_url);
                        }
                    }
                }
            }
        }
    }


    /**
     * Check if custom field exists in array
     *  
     * @param string $needle
     * @param array $array
     * 
     * @return bool|string
     * 
     */
    public function hasCustomField($needle, $array) {

        $array = is_array($array) ? $array : [];
        
        foreach ($array as $key => $value) {
            if ($value === $needle) {
                return $key;
            }
        }
        return false;
    }

    /*
     * -----------------------------
     *      Mapping Post data
     * -----------------------------
     */
    public function mf_post_data($form_settings, $form_data)
    {
        $data = [
            'post_type'    => isset($form_settings['mf_post_submission_post_type']) ? $form_settings['mf_post_submission_post_type'] : 'post',
            'post_title'   => isset($form_data[$form_settings['mf_post_submission_title']]) ? $form_data[$form_settings['mf_post_submission_title']] : '' ,
            'post_content' => isset($form_data[$form_settings['mf_post_submission_content']]) ? $form_data[$form_settings['mf_post_submission_content']] : '',
            'post_status'  => 'publish',
            'post_author'  => $form_settings['mf_post_submission_author'],
        ];

        return $data;
    }

    /*
     * ----------------------------
     *      Set thumbnail Image
     * ----------------------------
     */
    public function mf_set_thumbnail($post_id, $file_upload_infos, $form_settings)
    {
        $file = '';
        $set_thumbnail = false;

        foreach ($file_upload_infos as $key => $file_upload_info) {
            foreach($file_upload_info as $value) {
                $file        = $value['file'];
                $filename    = basename($file);
                $upload_file = wp_upload_bits($filename, null, file_get_contents($file));

                if (!$upload_file['error']) {
                    $wp_filetype = wp_check_filetype($filename, null );
                    $attachment  = array(
                        'post_mime_type' => $wp_filetype['type'],
                        'post_parent'    => $post_id,
                        'post_title'     => preg_replace('/\.[^.]+$/', '', $filename),
                        'post_content'   => '',
                        'post_status'    => 'inherit'
                    );

                    if($form_settings['mf_post_submission_featured_image'] === $key) {

                        $attachment_id = wp_insert_attachment( $attachment, $upload_file['file'], $post_id );
                        if (!is_wp_error($attachment_id)) {
                            require_once(ABSPATH . "wp-admin" . '/includes/image.php');
                            $attachment_data = wp_generate_attachment_metadata( $attachment_id, $upload_file['file'] );
                            wp_update_attachment_metadata( $attachment_id,  $attachment_data );
                            set_post_thumbnail($post_id, $attachment_id);
                        }
                        $set_thumbnail = true;
                        break;
                    }
                }
            }
            if($set_thumbnail) {
                break;
            }
        }
    }
}
