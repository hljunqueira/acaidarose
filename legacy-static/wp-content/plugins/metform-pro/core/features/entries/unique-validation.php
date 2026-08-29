<?php

namespace MetForm_Pro\Core\Features\Entries;

defined('ABSPATH') || exit;

class Unique_Validation
{
     /**
     * get all the submitted fields of given form  
     * @param int $form_id 
     * @param string $unique_fields_check 
     * @return  array
     */
    static function get_all_entries(int $form_id): array
    {
    
        $fields = [];

        $args = array(
            'post_type' => 'metform-entry',
            'posts_per_page' => '-1',
            'meta_query' => array(
                array(
                    'key' => 'metform_entries__form_id',
                    'value' => $form_id,
                    'compare' => '='
                ),
                array(
                    'key' => 'metform_entries__form_data',
                    'compare' => 'EXISTS' // Check for existence of this meta key
                )
            )
        );


        $query = new \WP_Query($args);


        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();

                
                $meta_value = get_post_meta(get_the_ID(), 'metform_entries__form_data', true);
                $fields[] = $meta_value;
            }
            wp_reset_postdata(); // Reset the post data to the main query
        }
        

        return $fields;
    }


    /**
     * Check for unique data
     * @param string $incoming_data 
     * @param array $data_list list of meta values
     * @param string $field_name 
     * @return bool  
     */
    static function is_unique_field(string $incoming_data,array $data_list, string $field_name) : bool
    {

        // loop through all entries
        foreach ($data_list as $entry) {
     
            if(isset($entry[$field_name]) && $entry[$field_name] == $incoming_data){

                return false;
            }
        }

        return true;
    }


    /**
     * check_duplicate_email find the duplicate email of the form by given id
     * @param int $form_id
     * @param array $form_data
     * @param array $fields
     * @return array
     */
    static function check_unique_fields(int $form_id, array $form_data = [], array $fields = []) : array
    {
       
        $mf_input_label= '';
        $duplicate_field_status = 0;
        $field_name = '';
        $entry_list = [];
        $is_unique = 0;

        // loop through all input fields
        foreach($fields as $field){

            $field_name = $field->mf_input_name ?? '';
            $mf_input_label = $field->mf_input_label ?? '';
             
            if( !empty($field->mf_unique_field) && ('yes' == $field->mf_unique_field)){
                if(isset($form_data[$field_name]) && '' == trim($form_data[$field_name])){
                    return ['status' => 0, 'duplicate_field' => $form_data[$field_name] ?? '', 'input_label'=> $mf_input_label];
                }
                if(empty($entry_list)){
                    $entry_list = Unique_Validation::get_all_entries($form_id);
                }
                if (!empty( $form_data[$field_name] )) {
                   
                   $is_unique = Unique_Validation::is_unique_field($form_data[$field_name], $entry_list, $field_name);
                }


                if(false == $is_unique){
                   $duplicate_field_status = 1;
                   break;
                }
            }
        }
        return ['status' => $duplicate_field_status, 'duplicate_field' => $form_data[$field_name] ?? '', 'input_label'=> $mf_input_label];
    }
}