<?php
namespace Elementor;
defined( 'ABSPATH' ) || exit;

Class MetForm_Input_Mobile extends Widget_Base{
	use \MetForm\Traits\Common_Controls;
	use \MetForm\Traits\Conditional_Controls;
    
    public function get_name(){
        return 'mf-mobile';
    }

	public function get_icon(){
		return 'mf-widget-icon icon-metform_mobile_number';
	}

    public function get_title(){
        return esc_html__( 'Mobile', 'metform-pro' );
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
        return ['metform-pro', 'input', 'mobile', 'number', 'phone', 'country code'];
    }

	public function get_help_url() {
        return 'https://wpmet.com/doc/premium-input-field-list/#mobile';
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

		$this->input_setting_controls(['VALIDATION']);

		$this->add_control(
			'country_code',
			[
				'label'		=> __( 'Default Country', 'metform-pro' ),
				'type'		=> Controls_Manager::SELECT,
				'default'	=> 'us',
				'options'	=> [
					'af'		=> 'Afghanistan',
					'al'		=> 'Albania',
					'dz'		=> 'Algeria',
					'ad'		=> 'Andorra',
					'ao'		=> 'Angola',
					'ag'		=> 'Antigua and Barbuda',
					'ar'		=> 'Argentina',
					'am'		=> 'Armenia',
					'aw'		=> 'Aruba',
					'au'		=> 'Australia',
					'at'		=> 'Austria',
					'az'		=> 'Azerbaijan',
					'bs'		=> 'Bahamas',
					'bh'		=> 'Bahrain',
					'bd'		=> 'Bangladesh',
					'bb'		=> 'Barbados',
					'by'		=> 'Belarus',
					'be'		=> 'Belgium',
					'bz'		=> 'Belize',
					'bj'		=> 'Benin',
					'bt'		=> 'Bhutan',
					'bo'		=> 'Bolivia',
					'ba'		=> 'Bosnia and Herzegovina',
					'bw'		=> 'Botswana',
					'br'		=> 'Brazil',
					'io'		=> 'British Indian Ocean Territory',
					'bn'		=> 'Brunei',
					'bg'		=> 'Bulgaria',
					'bf'		=> 'Burkina Faso',
					'bi'		=> 'Burundi',
					'kh'		=> 'Cambodia',
					'cm'		=> 'Cameroon',
					'ca'		=> 'Canada',
					'cv'		=> 'Cape Verde',
					'bq'		=> 'Caribbean Netherlands',
					'cf'		=> 'Central African Republic',
					'td'		=> 'Chad',
					'cl'		=> 'Chile',
					'cn'		=> 'China',
					'co'		=> 'Colombia',
					'km'		=> 'Comoros',
					'cd'		=> 'Congo',
					'cg'		=> 'Congo',
					'cr'		=> 'Costa Rica',
					'ci'		=> 'Côte d’Ivoire',
					'hr'		=> 'Croatia',
					'cu'		=> 'Cuba',
					'cw'		=> 'Curaçao',
					'cy'		=> 'Cyprus',
					'cz'		=> 'Czech Republic',
					'dk'		=> 'Denmark',
					'dj'		=> 'Djibouti',
					'dm'		=> 'Dominica',
					'do'		=> 'Dominican Republic',
					'ec'		=> 'Ecuador',
					'eg'		=> 'Egypt',
					'sv'		=> 'El Salvador',
					'gq'		=> 'Equatorial Guinea',
					'er'		=> 'Eritrea',
					'ee'		=> 'Estonia',
					'et'		=> 'Ethiopia',
					'fj'		=> 'Fiji',
					'fi'		=> 'Finland',
					'fr'		=> 'France',
					'gf'		=> 'French Guiana',
					'pf'		=> 'French Polynesia',
					'ga'		=> 'Gabon',
					'gm'		=> 'Gambia',
					'ge'		=> 'Georgia',
					'de'		=> 'Germany',
					'gh'		=> 'Ghana',
					'gr'		=> 'Greece',
					'gd'		=> 'Grenada',
					'gp'		=> 'Guadeloupe',
					'gu'		=> 'Guam',
					'gt'		=> 'Guatemala',
					'gn'		=> 'Guinea',
					'gw'		=> 'Guinea-Bissau',
					'gy'		=> 'Guyana',
					'ht'		=> 'Haiti',
					'hn'		=> 'Honduras',
					'hk'		=> 'Hong Kong',
					'hu'		=> 'Hungary',
					'is'		=> 'Iceland',
					'in'		=> 'India',
					'id'		=> 'Indonesia',
					'ir'		=> 'Iran',
					'iq'		=> 'Iraq',
					'ie'		=> 'Ireland',
					'il'		=> 'Israel',
					'it'		=> 'Italy',
					'jm'		=> 'Jamaica',
					'jp'		=> 'Japan',
					'jo'		=> 'Jordan',
					'kz'		=> 'Kazakhstan',
					'ke'		=> 'Kenya',
					'ki'		=> 'Kiribati',
					'xk'		=> 'Kosovo',
					'kw'		=> 'Kuwait',
					'kg'		=> 'Kyrgyzstan',
					'la'		=> 'Laos',
					'lv'		=> 'Latvia',
					'lb'		=> 'Lebanon',
					'ls'		=> 'Lesotho',
					'lr'		=> 'Liberia',
					'ly'		=> 'Libya',
					'li'		=> 'Liechtenstein',
					'lt'		=> 'Lithuania',
					'lu'		=> 'Luxembourg',
					'mo'		=> 'Macau',
					'mk'		=> 'Macedonia',
					'mg'		=> 'Madagascar',
					'mw'		=> 'Malawi',
					'my'		=> 'Malaysia',
					'mv'		=> 'Maldives',
					'ml'		=> 'Mali',
					'mt'		=> 'Malta',
					'mh'		=> 'Marshall Islands',
					'mq'		=> 'Martinique',
					'mr'		=> 'Mauritania',
					'mu'		=> 'Mauritius',
					'mx'		=> 'Mexico',
					'fm'		=> 'Micronesia',
					'md'		=> 'Moldova',
					'mc'		=> 'Monaco',
					'mn'		=> 'Mongolia',
					'me'		=> 'Montenegro',
					'ma'		=> 'Morocco',
					'mz'		=> 'Mozambique',
					'mm'		=> 'Myanmar',
					'na'		=> 'Namibia',
					'nr'		=> 'Nauru',
					'np'		=> 'Nepal',
					'nl'		=> 'Netherlands',
					'nc'		=> 'New Caledonia',
					'nz'		=> 'New Zealand',
					'ni'		=> 'Nicaragua',
					'ne'		=> 'Niger',
					'ng'		=> 'Nigeria',
					'kp'		=> 'North Korea',
					'no'		=> 'Norway',
					'om'		=> 'Oman',
					'pk'		=> 'Pakistan',
					'pw'		=> 'Palau',
					'ps'		=> 'Palestine',
					'pa'		=> 'Panama',
					'pg'		=> 'Papua New Guinea',
					'py'		=> 'Paraguay',
					'pe'		=> 'Peru',
					'ph'		=> 'Philippines',
					'pl'		=> 'Poland',
					'pt'		=> 'Portugal',
					'pr'		=> 'Puerto Rico',
					'qa'		=> 'Qatar',
					're'		=> 'Réunion',
					'ro'		=> 'Romania',
					'ru'		=> 'Russia',
					'rw'		=> 'Rwanda',
					'kn'		=> 'Saint Kitts and Nevis',
					'lc'		=> 'Saint Lucia',
					'vc'		=> 'Saint Vincent and the Grenadines',
					'ws'		=> 'Samoa',
					'sm'		=> 'San Marino',
					'st'		=> 'São Tomé and Príncipe',
					'sa'		=> 'Saudi Arabia',
					'sn'		=> 'Senegal',
					'rs'		=> 'Serbia',
					'sc'		=> 'Seychelles',
					'sl'		=> 'Sierra Leone',
					'sg'		=> 'Singapore',
					'sk'		=> 'Slovakia',
					'si'		=> 'Slovenia',
					'sb'		=> 'Solomon Islands',
					'so'		=> 'Somalia',
					'za'		=> 'South Africa',
					'kr'		=> 'South Korea',
					'ss'		=> 'South Sudan',
					'es'		=> 'Spain',
					'lk'		=> 'Sri Lanka',
					'sd'		=> 'Sudan',
					'sr'		=> 'Suriname',
					'sz'		=> 'Swaziland',
					'se'		=> 'Sweden',
					'ch'		=> 'Switzerland',
					'sy'		=> 'Syria',
					'tw'		=> 'Taiwan',
					'tj'		=> 'Tajikistan',
					'tz'		=> 'Tanzania',
					'th'		=> 'Thailand',
					'tl'		=> 'Timor-Leste',
					'tg'		=> 'Togo',
					'to'		=> 'Tonga',
					'tt'		=> 'Trinidad and Tobago',
					'tn'		=> 'Tunisia',
					'tr'		=> 'Turkey',
					'tm'		=> 'Turkmenistan',
					'tv'		=> 'Tuvalu',
					'ug'		=> 'Uganda',
					'ua'		=> 'Ukraine',
					'ae'		=> 'United Arab Emirates',
					'gb'		=> 'United Kingdom',
					'us'		=> 'United States',
					'uy'		=> 'Uruguay',
					'uz'		=> 'Uzbekistan',
					'vu'		=> 'Vanuatu',
					'va'		=> 'Vatican City',
					've'		=> 'Venezuela',
					'vn'		=> 'Vietnam',
					'ye'		=> 'Yemen',
					'zm'		=> 'Zambia',
					'zw'		=> 'Zimbabwe',
				],
			]
		);

		$this->add_control(
			'mf_mobile_same_format',
			[
				'label' => esc_html__( 'Get Same Number Format?', 'metform-pro' ),
				'type' => Controls_Manager::SWITCHER,
				'yes' => esc_html__( 'Yes', 'metform-pro' ),
				'no' => esc_html__( 'No', 'metform-pro' ),
				'return_value' => 'yes',
				'default' => 'no',
				'description' => esc_html__('Do you want to get same format in the entry after submit? Make it "Yes".', 'metform-pro'),
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
			'input_section',
			[
				'label' => esc_html__( 'Input', 'metform-pro' ),
				'tab' => Controls_Manager::TAB_STYLE,
			]
        );

        $this->input_controls();

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
		$inputWrapStart = $inputWrapEnd = '';
		extract($settings);
		$id = $this->get_id();

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
            'minLength'		=> isset($mf_input_min_length) ? $mf_input_min_length : 1,
            'maxLength'		=> isset($mf_input_max_length) ? $mf_input_max_length : '',
            'type'			=> isset($mf_input_validation_type) ? $mf_input_validation_type : '',
            'required'		=> isset($mf_input_required) && $mf_input_required == 'yes' ? true : false,
		];
		
		?>

		<?php echo $inputWrapStart; ?>

		<div className="mf-input-wrapper">
			<?php if ( 'yes' == $mf_input_label_status ): ?>
				<label className="mf-input-label" htmlFor="mf-input-mobile-<?php echo esc_attr( $this->get_id() ); ?>">
					<?php echo \MetForm\Utils\Util::react_entity_support( esc_html($mf_input_label), $render_on_editor ); ?>
					<span className="mf-input-required-indicator"><?php echo esc_html( ($mf_input_required === 'yes') ? '*' : '' );?></span>
				</label>
			<?php endif; ?>

			<${props.ReactPhoneInput}
				inputProps=${{
					name: "<?php echo esc_attr($mf_input_name); ?>"
				}}
				inputExtraProps=${{
					required: true,
					autoFocus: true,
				}}
				key=${parent.state.resetKey}
				searchPlaceholder="<?php echo esc_html__('Search', 'metform-pro');?>"
				inputClass="mf-input mf-input-mobile"
				country="<?php echo esc_attr( $country_code ); ?>"
				enableSearch=${true}
				countryCodeEditable=${false}
				enableAreaCodes=${false}
				value=${parent.state.mobileWidget["<?php echo esc_attr($mf_input_name); ?>"] ? parent.state.mobileWidget["<?php echo esc_attr($mf_input_name); ?>"] : 
				(parent.state.formData["<?php echo esc_attr($mf_input_name); ?>"] ? parent.state.formData["<?php echo esc_attr($mf_input_name); ?>"] : '')}
				}
				name="<?php echo esc_attr($mf_input_name); ?>"
				id="mf-input-mobile-<?php echo esc_attr($this->get_id()); ?>"
				onChange=${(value, country) => {
					return parent.handleOnChangePhoneInput(value, "<?php echo esc_attr($mf_input_name); ?>", country)
				} }
				onBlur=${(event, country) => {
					let value = event.target.value;
					if(value && "<?php echo esc_attr($mf_mobile_same_format); ?>" != "yes"){
						value = value.replace(/[^\d]/g, '');
					}
					parent.handleOnChangePhoneInput(value, "<?php echo esc_attr($mf_input_name); ?>", country)
				} }
				/>
			<?php if ( !$is_edit_mode ) : ?>
				<input
					type="hidden"
					name="<?php echo esc_attr( $mf_input_name ); ?>"
					className="mf-input mf-mobile-hidden"
					style="display:none;"
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
