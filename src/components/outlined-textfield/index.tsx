import React from "react";
import { Menu, Dropdown, Button } from "antd";
import { DownOutlined } from "@ant-design/icons";
import cx from 'classnames';
import s from "./styles.module.css";
interface Option {
  key: string;
  label: string;
}

export type OutlinedTextFieldProp = {
  onChange: Function,
  onChangeText?: Function,
  options?: Option[],
  dropDownLabel?: string,
  label: string,
  value?: string,
  placeholder?: string,
  startAdornment?: React.ReactElement,
  disabled?: boolean,
};

const OutlinedTextField: React.FunctionComponent<OutlinedTextFieldProp> = (
  props
) => {
  const { onChange, onChangeText, options, dropDownLabel, label, value, placeholder, disabled } = props;

  const menu = (
    <Menu>
      {options?.map((item, index) => (
        <Menu.Item key={item.key} onClick={() => { onChange(item.key) }}>{item.label}</Menu.Item>
      ))}
    </Menu>
  );

  return (
    <div className={s.component}>
      <label className={s.label}>{label}</label>
      <div className={s.inputWrapper}>
        {dropDownLabel && (
          <div>
            <Dropdown overlay={menu} trigger={["click"]}>
              <Button className={s.dropDownLabel}>
                {dropDownLabel} <DownOutlined />
              </Button>
            </Dropdown>
          </div>
        )}
        {dropDownLabel ?
          <input className={s.input} value={value} placeholder={placeholder} onChange={(e) => { onChangeText && onChangeText(e.target.value) }} /> :
          <input className={cx(s.input, s.noDropDownPadding)} value={value} placeholder={placeholder} onChange={(e) => { onChangeText && onChangeText(e.target.value) }} disabled={disabled}/>
        }
      </div>
    </div>
  );
};

export default OutlinedTextField;


