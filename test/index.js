import React from 'react'
import { Button as Zutton, SearchGroup as A, Form, Input } from '@ad/r-ui'

const { Item: FormItem } = Form

export default function App() {
  return (
    <div className="app">
      <Button type="primary">click me</Button>
      <A>
        <A.Item></A.Item>
        <A.Item />
      </A>
      <Form>
        <FormItem />
      </Form>
    </div>
  )
}
