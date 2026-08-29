<?php

namespace MetForm_Pro\Core\Integrations\Google_Sheet;

use MetFormProVendor\Google\Client as Google_Client;
use MetFormProVendor\Google\Service\Sheets as Google_Service_Sheets;
use MetFormProVendor\Google\Service\Sheets\Spreadsheet as Google_Service_Sheets_Spreadsheet;
use MetFormProVendor\Google\Service\Sheets\ValueRange as Google_Service_Sheets_ValueRange;
use MetFormProVendor\GuzzleHttp\Client;
use MetForm\Traits\Singleton;

defined( 'ABSPATH' ) || exit;

class WF_Google_Sheet {

    use Singleton;

    public $google_client_id;

	public $google_client_secret;

    public function __construct()
    {
        $settings = \MetForm\Core\Admin\Base::instance()->get_settings_option();
        $this->google_client_id = isset($settings['mf_google_sheet_client_id']) ? $settings['mf_google_sheet_client_id'] : '';
        $this->google_client_secret = isset($settings['mf_google_sheet_client_secret']) ? $settings['mf_google_sheet_client_secret'] : '';
    }

    function get_client(){
        $client = new Google_Client();

        $arr_token = $this->token();

        if($arr_token == false){
            return false;
        }

        $accessToken = array(
            'access_token' => $arr_token->access_token,
            'expires_in' => $arr_token->expires_in,
        );
        $client->setAccessToken($accessToken);

        return $client;
    }

    public function create($title, $names) {

        $service = $this->service(); // Google_Service_Sheets

        if($service == false){
            return false;
        }

        try {
            $spreadsheet = new Google_Service_Sheets_Spreadsheet([
                'properties' => [
                    'title' => $title
                ]
            ]);
            $spreadsheet = $service->spreadsheets->create($spreadsheet, [
                'fields' => 'spreadsheetId'
            ]);
            $this->insert_names($spreadsheet->spreadsheetId, $names);
            return $spreadsheet->spreadsheetId;

        }catch(\Exception $e) {

            error_log(print_r($e->getMessage() ,true));
            return false;
        }

    }

    public function get_sheet_id($form_id, $names, $title){
        $google_sheet_id = 'wf_google_sheet_'.$form_id;
        $sheet = get_option($google_sheet_id);
        if($sheet){
            return $sheet;
        }else{
            $create = $this->create($title, $names);
            if ($create) {
                add_option($google_sheet_id, $create);
                return $create;
            }
            return false;
        }
    }

    public function update_names($form_id, $form_fields) {
        $google_sheet_option_name = 'wf_google_sheet_'.$form_id.'names';
        $option_names = get_option($google_sheet_option_name);
        if($option_names) {
            foreach($option_names as $option) {
                unset($form_fields[$option]);
            }
            foreach($form_fields as $key => $field) {
                $option_names[] = $key;
            }
        }else {
            foreach($form_fields as $key => $form_fields) {
                $option_names[] = $key;
            }
        }
        update_option($google_sheet_option_name, $option_names);

        return $option_names;
        
    }

    public function insert($form_id, $form_title, $form_data, $file_upload_info, $form_fields,  $sheetdata = null ) {   

        if(isset($form_data['mf-mobile'])){
           $form_data['mf-mobile'] = ltrim($form_data['mf-mobile'],'+');
        }

        $google_sheet_option_name = 'wf_google_sheet_'.$form_id.'names';
        $names = get_option($google_sheet_option_name);
        $values = [];
        if (!$names) {
            $names = $this->update_names($form_id, $form_fields);
        }
    
        if(!empty($names) && count($names) !=  count($form_fields)) {
            $names = $this->update_names($form_id, $form_fields);
        }
        
        if(isset($file_upload_info)){
            foreach($file_upload_info as $key => $files) {
                $url = '';
                foreach($files as $file) {
                    $url .= isset($file['url']) ? $file['url']. ' , ' : '';
                }
                $form_data[$key] = $url;
            }
        }

        foreach($names as $name) {
            if(isset($form_data[$name]) && is_array($form_data[$name])){
                if(isset($form_fields['mf-simple-repeater'])){
                    $totalFieldsCount = count($form_fields['mf-simple-repeater']->mf_input_repeater);
                    $totalRepeaterCount = count($form_data['mf-simple-repeater']);
                    $input_name =  $form_fields['mf-simple-repeater']->mf_input_repeater[0]->mf_input_repeater_name;
                    
                    $data = '';
                    $item_counter = ceil($totalRepeaterCount / $totalFieldsCount);
                    for($i = 1; $i <= $item_counter; $i++ ){
                        for($k = 0; $k < $totalFieldsCount; $k++ ){
                        $input_name =  $form_fields['mf-simple-repeater']->mf_input_repeater[$k]->mf_input_repeater_name."-$i";
                        $data .= $form_data['mf-simple-repeater'][$input_name]. " - ";
                        }
                        $data = trim($data, " - ")."\n";
                    }
                    $values[] =  $data;
                }
            }else{
            $values[] = isset($form_data[$name]) ? $form_data[$name] : '';
            }
        }

        $range_value = 'A2:Z2';

        if(!empty($sheetdata) && $sheetdata != null) {
            if(isset($sheetdata['sheet_id'])){
                $sheet_id = $sheetdata['sheet_id'];
            }

            if (isset($sheetdata['sheet_title_no'])) {
                $sheet_title = $sheetdata['sheet_title_no'];
                $range_value = $sheet_title.'!A2:Z2';
                $this->insert_names($sheet_id, $names, $sheet_title);
            }
         
        }

        if(empty($sheet_id)){
            $sheet_id = $this->get_sheet_id($form_id, $names, $form_title);
            $range_value = 'A2:Z2';
        }

        if($sheet_id === false) {
            return false;
        } 

        $service = $this->service();
        if($service == false) {
            return false;
        }

        try {
            $range = $range_value;
            $body = new Google_Service_Sheets_ValueRange([
                'values' => [$values]
            ]);
            $params = [
                'valueInputOption' => 'USER_ENTERED'
            ];
            $result = $service->spreadsheets_values->append($sheet_id, $range, $body, $params);
        } catch(\Exception $e) {
            $arr_token = $this->token();
            if($arr_token == false) {
                return false;
            }
            if( 401 == $e->getCode() ) {
                $this->insert($form_id, $form_title, $form_data, $file_upload_info, $form_fields);
            }
        }
    }

    public function insert_names($sheet_id, $names, $sheet_title = null) {
        $service = $this->service();
        if($service == false) {
            return false;
        }
        try {
            $range = 'A1:Z1';

            if($sheet_title) {
                $range = $sheet_title.'!A1:Z1';
            }
            
            $body = new Google_Service_Sheets_ValueRange([
                'values' => [$names]
            ]);
            $params = [
                'valueInputOption' => 'USER_ENTERED'
            ];
            $result = $service->spreadsheets_values->update($sheet_id, $range, $body, $params);
        } catch(\Exception $e) {
            $arr_token = $this->token();
            if($arr_token == false) {
                return false;
            }
            if( 401 == $e->getCode() ) {
                $this->insert_names($sheet_id, $names);
            }
        }
    }

    public function service() {

        $client = $this->get_client();
        if($client == false){
            return false;
        }
        $service = new Google_Service_Sheets($client);

        return $service;
    }

    public function token()
    {
        if (!get_transient('mf_google_sheet_token')) {
           
           return $this->get_new_token();
        }
        return get_option('wf_google_access_token') ? json_decode(get_option('wf_google_access_token')) : false;
    }

    private function get_new_token(){

        $client = new Client(['base_uri' => 'https://accounts.google.com']);

        $arr_token = get_option('wf_google_access_token') ? json_decode(get_option('wf_google_access_token')) : false;

        if($arr_token == false){
            return false;
        }

        $response = $client->request('POST', '/o/oauth2/token', [
            'form_params' => [
                "grant_type" => "refresh_token",
                "refresh_token" => $arr_token->refresh_token,
                "client_id" => $this->google_client_id,
                "client_secret" => $this->google_client_secret,
            ],
        ]);

        $data = (array) json_decode($response->getBody());
           
        $data['refresh_token'] = $arr_token->refresh_token;
        update_option('wf_google_access_token', json_encode($data));

        set_transient('mf_google_sheet_token', $data,  $data['expires_in'] - 20); // set 20 seconds early expiration to get new token
        $arr_token = json_decode(get_option('wf_google_access_token'));

        if ($arr_token) {
            return $arr_token;
        } else {
            return false;
        }
    }

    public function get_all_spreadsheets() {

        try {
            $url = 'https://www.googleapis.com/drive/v3/files';
            $method = 'get';
            $request =array('q' => "mimeType='application/vnd.google-apps.spreadsheet'", 'pageSize' => 1000, 'includeItemsFromAllDrives' => 'true', 'supportsAllDrives' => 'true', 'orderBy' => 'name');

            $arr_token = $this->token();
            if($arr_token == false) {
                return false;
            }
            
            $headers = array(
                'Authorization' => 'Bearer ' . $arr_token->access_token,
                "client_id"     => $this->google_client_id,
                "client_secret" => $this->google_client_secret,
                'Content-Type' => 'application/json',
            );

            $response = wp_remote_get( $url, array(
            'method' => strtoupper($method),
            'timeout' => $arr_token->expires_in, //
            'headers' => $headers,
            'body' => $request
            ));

            if(is_wp_error($response)){
                $result=json_encode(array('wp_error'=>$response->get_error_message()));   
            }else{
                $result=wp_remote_retrieve_body($response); 
            }
           
            return $result;

        }catch(\Exception $e) {

            return false;
        }
    }

    public function get_sheets_details_from_spreadsheet($spreadsheetId) {
        try {

            $url    = "https://sheets.googleapis.com/v4/spreadsheets/". $spreadsheetId;
            $method = 'get';

            $arr_token = $this->token();
            if ($arr_token == false) {
                return false;
            }

            $headers = array(
                'Authorization' => 'Bearer ' . $arr_token->access_token,
                "client_id"     => $this->google_client_id,
                "client_secret" => $this->google_client_secret,
                'Content-Type'  => 'application/json',
            );

            $response = wp_remote_get($url, array(
                'method'  => strtoupper($method),
                'timeout' => $arr_token->expires_in, //
                'headers' => $headers,
                // 'body' => $request
            ));

            if (is_wp_error($response)) {
                $result = json_encode(array('wp_error' => $response->get_error_message()));
            } else {
                $result = wp_remote_retrieve_body($response);
            }

            return $result;
            
        }catch(\Exception $e) {

            return false;

        }
    }
}