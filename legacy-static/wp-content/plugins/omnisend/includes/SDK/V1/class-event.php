<?php
/**
 * Omnisend Client
 *
 * @package OmnisendClient
 */

namespace Omnisend\SDK\V1;

use Omnisend\SDK\V1\Contact;
use WP_Error;

defined( 'ABSPATH' ) || die( 'no direct access' );

/**
 * Omnisend Event class. It's should be used with Omnisend Client.
 *
 */
class Event {
	private $contact          = null;
	private $event_name       = null;
	private $event_time       = null;
	private $event_version    = null;
	private $origin           = null;
	private $event_properties = null;
	private array $properties = array();

	/**
	 * Validate event properties.
	 *
	 * It ensures that all required properties are set
	 *
	 * @return WP_Error
	 */
	public function validate(): WP_Error {
		$error = new WP_Error();

		if ( $this->contact instanceof Contact ) {
			$error->merge_from( $this->contact->validate() );
		}

		if ( $this->event_name == null && empty( $this->event_properties ) ) {
			$error->add( 'event_name', 'Is required.' );
		}

		if ( $this->event_name != null && ! is_string( $this->event_name ) ) {
			$error->add( 'event_name', 'Not a string.' );
		}

		if ( $this->event_version != null && ! is_string( $this->event_version ) ) {
			$error->add( 'event_version', 'Not a string.' );
		}

		if ( $this->origin != null && ! is_string( $this->origin ) ) {
			$error->add( 'origin', 'Not a string.' );
		}

		if ( $this->event_time !== null && ! is_string( $this->event_time ) ) {
			$error->add( 'event_time', 'Not a string.' );
		}

		if ( $this->event_properties === null ) {
			foreach ( $this->properties as $name ) {
				if ( ! is_string( $name ) ) {
					$error->add( $name, 'Not a string.' );
				}
			}
		}

		if ( $this->event_properties ) {
			if ( ! method_exists( $this->event_properties, 'validate' ) ||
				! method_exists( $this->event_properties, 'to_array' ) ||
				! defined( get_class( $this->event_properties ) . '::EVENT_NAME' )
			) {
				$error->add( 'event_properties', 'event property is not Omnisend/SDK/V1/Events property' );
			} else {
				$error->merge_from( $this->event_properties->validate() );
			}
		}

		return $error;
	}

	/**
	 * Sets event name.
	 *
	 * Not needed, if using Omnisend/SDK/V1/Events for "set_recommended_event" method
	 *
	 * @param string $event_name
	 *
	 * @return void
	 */
	public function set_custom_event_name( $event_name ): void {
		$this->event_name = $event_name;
	}

	/**
	 * Sets event version.
	 *
	 * @param string $event_version
	 *
	 * @return void
	 */
	public function set_event_version( $event_version ): void {
		$this->event_version = $event_version;
	}

	/**
	 * Sets event origin. Default value is api
	 *
	 * @param string $origin
	 *
	 * @return void
	 */
	public function set_origin( $origin ): void {
		$this->origin = $origin;
	}

	/**
	 * Sets event time, format: "Y-m-d\Th:i:s\Z"
	 *
	 * @param string $event_time
	 *
	 * @return void
	 */
	public function set_event_time( $event_time ): void {
		$this->event_time = $event_time;
	}

	/**
	 * Sets custom event properties
	 *
	 * Alternative method for "add_custom_event_property".
	 *
	 * If event is not custom, use "set_recommended_event" method
	 *
	 * @param array $properties
	 *
	 * @return void
	 */
	public function set_custom_event_properties( $properties ): void {
		$this->properties = $properties;
	}

	/**
	 * Adds custom event property
	 *
	 * Alternative method for "set_custom_event_properties".
	 *
	 * If event is not custom, use "set_recommended_event" method
	 *
	 * @param string $key
	 * @param string $value
	 *
	 * @return void
	 */
	public function add_custom_event_property( $key, $value ): void {
		if ( $key == '' ) {
			return;
		}

		$this->properties[ $key ] = $value;
	}

	/**
	 * Sets recommended event properties
	 *
	 * Should use this, if event is from "Omnisend/SDK/V1/Events" namespace
	 *
	 * @param Object $event
	 *
	 * @return void
	 */
	public function set_recommended_event( $event ): void {
		$this->event_properties = $event;
	}

	/**
	 * Sets contact.
	 *
	 * @param Contact $contact
	 *
	 * @return void
	 */
	public function set_contact( $contact ): void {
		$this->contact = $contact;
	}

	/**
	 * Convert event to array.
	 *
	 * If event is valid it will be transformed to array that can be sent to Omnisend.
	 *
	 * @return array
	 */
	public function to_array(): array {
		if ( $this->validate()->has_errors() ) {
			return array();
		}

		$arr = array();

		if ( $this->contact ) {
			$arr['contact'] = $this->contact->to_array_for_event();
		}

		if ( $this->event_name ) {
			$arr['eventName'] = $this->event_name;
		}

		$arr['origin'] = 'api';
		if ( $this->origin ) {
			$arr['origin'] = $this->origin;
		}

		if ( $this->event_version ) {
			$arr['eventVersion'] = $this->event_version;
		}

		if ( $this->properties && $this->event_properties === null ) {
			$arr['properties'] = $this->properties;
		}

		if ( $this->event_time ) {
			$arr['eventTime'] = $this->event_time;
		}

		if ( $this->event_properties ) {
			$arr['properties'] = $this->event_properties->to_array();
			$arr['eventName']  = $this->event_properties::EVENT_NAME;
		}

		return $arr;
	}
}
