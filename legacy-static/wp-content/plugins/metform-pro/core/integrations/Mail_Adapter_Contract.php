<?php
namespace MetForm_Pro\Core\Integrations;


interface Mail_Adapter_Contract {


	public function get_token();

	public function get_adapter();

}