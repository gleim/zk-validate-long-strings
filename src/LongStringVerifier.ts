import { Field, SmartContract, state, State, method } from 'snarkyjs';

/**
 *
 * The contract initializes the state variable 'crc' to be a Field(0) value by default when deployed.
 *
 */
export class LongStringVerifier extends SmartContract {
  @state(Field) crc = State<Field>();

  init() {
    super.init();
    this.crc.set(Field(0));
  }

  @method setCrc(crc: Field) {
    const currentState = this.crc.getAndAssertEquals();
    const newState = crc;
    this.crc.set(newState);
  }
}
